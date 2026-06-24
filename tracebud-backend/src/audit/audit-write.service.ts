import { BadRequestException, ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { assertTenantClaimOrFieldActor } from '../auth/field-app-auth';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

export type AuditAppendResult = {
  id?: string;
  timestamp?: string;
  ok: true;
  idempotent?: boolean;
};

type AppendParams = {
  dto: CreateAuditEventDto;
  user: any;
};

@Injectable()
export class AuditWriteService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  resolveCreateTenantId(reqUser: any, dto: CreateAuditEventDto): string {
    const fromJwt = deriveTenantIdFromSupabaseUser(reqUser);
    if (fromJwt) {
      return fromJwt;
    }

    const fromPayload =
      typeof dto.payload?.tenantId === 'string' ? dto.payload.tenantId.trim() : '';
    if (fromPayload) {
      return fromPayload;
    }

    const fromUserMeta = reqUser?.user_metadata?.tenant_id;
    if (typeof fromUserMeta === 'string' && fromUserMeta.trim()) {
      return fromUserMeta.trim();
    }

    const email = typeof reqUser?.email === 'string' ? reqUser.email.trim() : '';
    if (email) {
      return `tenant_${email.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;
    }

    const userId = typeof reqUser?.id === 'string' ? reqUser.id.trim() : '';
    if (userId) {
      return `field_${userId}`;
    }

    throw new ForbiddenException('Missing tenant claim in app_metadata');
  }

  private assertCanAppend(params: AppendParams): { tenantId: string; eventType: string } {
    const { dto, user } = params;
    const tenantId = this.resolveCreateTenantId(user, dto);
    const role = deriveRoleFromSupabaseUser(user);
    const eventType = dto.eventType?.trim() ?? '';
    const isDashboardEvent = eventType.startsWith('dashboard_');
    if (eventType === 'offline_declaration_bundle' && role !== 'farmer') {
      throw new ForbiddenException(
        'Producer declaration bundles may only be submitted by the farmer app account',
      );
    }
    const payloadSchema =
      typeof dto.payload?.schema === 'string' ? dto.payload.schema.trim() : '';
    if (
      payloadSchema === 'tracebud.offline.declaration_bundle.v1' &&
      role !== 'farmer'
    ) {
      throw new ForbiddenException(
        'Personal portability exports cannot be ingested by organisations; use consent grants and plot sync',
      );
    }
    if (
      !isDashboardEvent &&
      role !== 'farmer' &&
      role !== 'agent' &&
      role !== 'exporter'
    ) {
      throw new ForbiddenException('Only farmers, agents, or exporters can append audit events');
    }
    if (!eventType || typeof dto.payload !== 'object' || dto.payload === null) {
      throw new BadRequestException('eventType and payload are required');
    }
    return { tenantId, eventType };
  }

  private normalizeClientEventId(dto: CreateAuditEventDto, payload: Record<string, unknown>): string | null {
    const fromDto = dto.clientEventId?.trim();
    const fromPayload =
      typeof payload.clientEventId === 'string' ? payload.clientEventId.trim() : '';
    const value = fromDto || fromPayload;
    return value || null;
  }

  async appendEvent(params: AppendParams): Promise<AuditAppendResult> {
    await assertTenantClaimOrFieldActor(this.pool, params.user);
    const { tenantId, eventType } = this.assertCanAppend(params);
    const userId = params.user?.id as string | undefined;
    const clientEventId = this.normalizeClientEventId(params.dto, params.dto.payload);
    const payload = {
      ...params.dto.payload,
      tenantId:
        typeof params.dto.payload.tenantId === 'string' ? params.dto.payload.tenantId : tenantId,
      ...(clientEventId ? { clientEventId } : {}),
    };

    if (clientEventId && userId) {
      const existing = await this.pool.query<{ id: string; timestamp: string }>(
        `
          SELECT id, timestamp
          FROM audit_log
          WHERE user_id = $1
            AND event_type = $2
            AND payload ->> 'clientEventId' = $3
          ORDER BY timestamp DESC
          LIMIT 1
        `,
        [userId, eventType, clientEventId],
      );
      if (existing.rows[0]) {
        return { ok: true as const, idempotent: true, ...existing.rows[0] };
      }
    }

    try {
      const res = await this.pool.query<{ id: string; timestamp: string }>(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
          RETURNING id, timestamp
        `,
        [
          userId ?? null,
          params.dto.deviceId?.trim() || null,
          eventType,
          JSON.stringify(payload),
        ],
      );
      return { ok: true as const, ...res.rows[0] };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException('audit_log table is not available on this server');
      }
      if (err?.code === '23505' && clientEventId && userId) {
        const existing = await this.pool.query<{ id: string; timestamp: string }>(
          `
            SELECT id, timestamp
            FROM audit_log
            WHERE user_id = $1
              AND event_type = $2
              AND payload ->> 'clientEventId' = $3
            ORDER BY timestamp DESC
            LIMIT 1
          `,
          [userId, eventType, clientEventId],
        );
        if (existing.rows[0]) {
          return { ok: true as const, idempotent: true, ...existing.rows[0] };
        }
      }
      throw e;
    }
  }

  async appendBatch(params: {
    events: CreateAuditEventDto[];
    user: any;
  }): Promise<{
    accepted: number;
    idempotent: number;
    failed: number;
    results: Array<AuditAppendResult | { ok: false; message: string }>;
  }> {
    const results: Array<AuditAppendResult | { ok: false; message: string }> = [];
    let accepted = 0;
    let idempotent = 0;
    let failed = 0;

    for (const dto of params.events) {
      try {
        const row = await this.appendEvent({ dto, user: params.user });
        results.push(row);
        if (row.idempotent) {
          idempotent += 1;
        } else {
          accepted += 1;
        }
      } catch (e) {
        failed += 1;
        results.push({
          ok: false,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { accepted, idempotent, failed, results };
  }
}
