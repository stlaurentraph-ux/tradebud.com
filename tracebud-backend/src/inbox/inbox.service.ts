import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

type InboxRequestStatus = 'PENDING' | 'RESPONDED';
type RequestType = 'MISSING_PLOT_GEOMETRY' | 'GENERAL_EVIDENCE' | 'CONSENT_GRANT';

export interface InboxRequestRecord {
  id: string;
  campaign_id: string;
  title: string;
  request_type: RequestType;
  due_at: string;
  from_org: string;
  sender_tenant_id: string;
  recipient_tenant_id: string;
  status: InboxRequestStatus;
  created_at: string;
  updated_at: string;
}

type BootstrapAction = 'reset' | 'seed_first_customer' | 'seed_golden_path';

@Injectable()
export class InboxService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  private schemaCheckInFlight: Promise<void> | null = null;

  private defaultRequests(nowIso: string): InboxRequestRecord[] {
    return [
      {
        id: 'req_inbox_001',
        campaign_id: 'campaign_demo_001',
        title: 'Upload updated FPIC packet',
        request_type: 'CONSENT_GRANT',
        due_at: '2026-04-15T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'PENDING',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'req_inbox_002',
        campaign_id: 'campaign_demo_002',
        title: 'Confirm missing plot geometry evidence',
        request_type: 'MISSING_PLOT_GEOMETRY',
        due_at: '2026-04-12T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'PENDING',
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];
  }

  private firstCustomerRequests(nowIso: string): InboxRequestRecord[] {
    return [
      {
        id: 'req_inbox_seed_001',
        campaign_id: 'campaign_seed_001',
        title: 'Upload updated FPIC packet',
        request_type: 'CONSENT_GRANT',
        due_at: '2026-04-15T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'PENDING',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'req_inbox_seed_002',
        campaign_id: 'campaign_seed_002',
        title: 'Confirm missing plot geometry evidence',
        request_type: 'MISSING_PLOT_GEOMETRY',
        due_at: '2026-04-12T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'PENDING',
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];
  }

  private goldenPathRequests(nowIso: string): InboxRequestRecord[] {
    return [
      {
        id: 'req_inbox_gp_001',
        campaign_id: 'campaign_gp_001',
        title: 'Upload updated FPIC packet',
        request_type: 'CONSENT_GRANT',
        due_at: '2026-04-15T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'RESPONDED',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'req_inbox_gp_002',
        campaign_id: 'campaign_gp_002',
        title: 'Confirm missing plot geometry evidence',
        request_type: 'MISSING_PLOT_GEOMETRY',
        due_at: '2026-04-12T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: 'tenant_brazil_001',
        recipient_tenant_id: 'tenant_rwanda_001',
        status: 'PENDING',
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];
  }

  private requestsForAction(action: BootstrapAction): InboxRequestRecord[] {
    const nowIso = new Date().toISOString();
    if (action === 'seed_first_customer') return this.firstCustomerRequests(nowIso);
    if (action === 'seed_golden_path') return this.goldenPathRequests(nowIso);
    return this.defaultRequests(nowIso);
  }

  private mapRowToRecord(row: {
    id: string;
    campaign_id: string;
    title: string;
    request_type: RequestType;
    due_at: Date | string;
    from_org: string;
    sender_tenant_id: string;
    recipient_tenant_id: string;
    status: InboxRequestStatus;
    created_at: Date | string;
    updated_at: Date | string;
  }): InboxRequestRecord {
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      title: row.title,
      request_type: row.request_type,
      due_at: new Date(row.due_at).toISOString(),
      from_org: row.from_org,
      sender_tenant_id: row.sender_tenant_id,
      recipient_tenant_id: row.recipient_tenant_id,
      status: row.status,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  private async emitAuditEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES ($1, $2::jsonb)
      `,
      [eventType, JSON.stringify(payload)],
    );
  }

  private async ensureSchema(): Promise<void> {
    const client = await this.pool.connect();
    const advisoryLockKey = 9162401;
    try {
      await client.query('SELECT pg_advisory_lock($1)', [advisoryLockKey]);

      await client.query(
        `
        CREATE TABLE IF NOT EXISTS public.inbox_requests (
          id TEXT PRIMARY KEY,
          campaign_id TEXT NOT NULL,
          title TEXT NOT NULL,
          request_type TEXT NOT NULL CHECK (request_type IN ('MISSING_PLOT_GEOMETRY', 'GENERAL_EVIDENCE', 'CONSENT_GRANT')),
          due_at TIMESTAMPTZ NOT NULL,
          from_org TEXT NOT NULL,
          sender_tenant_id TEXT NOT NULL,
          recipient_tenant_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PENDING', 'RESPONDED')),
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `,
      );

      await client.query(
        `
        CREATE TABLE IF NOT EXISTS public.inbox_request_events (
          id BIGSERIAL PRIMARY KEY,
          request_id TEXT NOT NULL REFERENCES public.inbox_requests(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          actor_tenant_id TEXT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      );

      await client.query(
        `
        CREATE INDEX IF NOT EXISTS idx_inbox_requests_recipient_status_due
        ON public.inbox_requests(recipient_tenant_id, status, due_at)
      `,
      );
      await client.query(
        `
        CREATE INDEX IF NOT EXISTS idx_inbox_requests_campaign
        ON public.inbox_requests(campaign_id)
      `,
      );
      await client.query(
        `
        CREATE INDEX IF NOT EXISTS idx_inbox_request_events_request_id
        ON public.inbox_request_events(request_id)
      `,
      );
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [advisoryLockKey]).catch(() => undefined);
      client.release();
    }
  }

  private async ensureSchemaVerified(): Promise<void> {
    // Collapse concurrent callers to one schema verification pass.
    if (this.schemaCheckInFlight) {
      await this.schemaCheckInFlight;
      return;
    }
    this.schemaCheckInFlight = (async () => {
      await this.ensureSchema();
      const verify = await this.pool.query<{
        inbox_requests: string | null;
        inbox_request_events: string | null;
      }>(
        `
          SELECT
            to_regclass('public.inbox_requests')::text AS inbox_requests,
            to_regclass('public.inbox_request_events')::text AS inbox_request_events
        `,
      );
      const row = verify.rows[0];
      if (!row?.inbox_requests || !row?.inbox_request_events) {
        await this.ensureSchema();
      }
    })();
    try {
      await this.schemaCheckInFlight;
    } finally {
      this.schemaCheckInFlight = null;
    }
  }

  private async upsertRequests(requests: InboxRequestRecord[], action: BootstrapAction | 'auto_init'): Promise<void> {
    await this.ensureSchemaVerified();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM public.inbox_request_events');
        await client.query('DELETE FROM public.inbox_requests');
      } catch (error: any) {
        // If tests dropped tables between operations, recreate schema and retry once.
        if (error?.code === '42P01') {
          await client.query('ROLLBACK');
          await this.ensureSchemaVerified();
          await client.query('BEGIN');
          await client.query('DELETE FROM public.inbox_request_events');
          await client.query('DELETE FROM public.inbox_requests');
        } else {
          throw error;
        }
      }

      for (const request of requests) {
        await client.query(
          `
            INSERT INTO public.inbox_requests (
              id,
              campaign_id,
              title,
              request_type,
              due_at,
              from_org,
              sender_tenant_id,
              recipient_tenant_id,
              status,
              created_at,
              updated_at
            )
            VALUES ($1,$2,$3,$4,$5::timestamptz,$6,$7,$8,$9,$10::timestamptz,$11::timestamptz)
          `,
          [
            request.id,
            request.campaign_id,
            request.title,
            request.request_type,
            request.due_at,
            request.from_org,
            request.sender_tenant_id,
            request.recipient_tenant_id,
            request.status,
            request.created_at,
            request.updated_at,
          ],
        );

        await client.query(
          `
            INSERT INTO public.inbox_request_events (request_id, event_type, actor_tenant_id, payload)
            VALUES ($1, $2, $3, $4::jsonb)
          `,
          [
            request.id,
            'REQUEST_SEEDED',
            request.sender_tenant_id,
            JSON.stringify({ action, status: request.status }),
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async seedIfEmpty(): Promise<void> {
    await this.ensureSchemaVerified();
    let countRes;
    try {
      countRes = await this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM public.inbox_requests');
    } catch (error: any) {
      if (error?.code === '42P01') {
        await this.ensureSchemaVerified();
        countRes = await this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM public.inbox_requests');
      } else {
        throw error;
      }
    }
    if ((Number(countRes.rows[0]?.count ?? '0')) > 0) return;
    const defaults = this.requestsForAction('reset');
    await this.upsertRequests(defaults, 'auto_init');
    await this.emitAuditEvent('inbox_requests_seeded', {
      action: 'auto_init',
      requestCount: defaults.length,
      writtenAt: new Date().toISOString(),
    });
  }

  async list(tenantId: string): Promise<InboxRequestRecord[]> {
    if (!tenantId) {
      throw new BadRequestException('Authenticated tenant context is required.');
    }
    await this.seedIfEmpty();
    const rowsRes = await this.pool.query<{
      id: string;
      campaign_id: string;
      title: string;
      request_type: RequestType;
      due_at: Date | string;
      from_org: string;
      sender_tenant_id: string;
      recipient_tenant_id: string;
      status: InboxRequestStatus;
      created_at: Date | string;
      updated_at: Date | string;
    }>(
      `
        SELECT
          id,
          campaign_id,
          title,
          request_type,
          due_at,
          from_org,
          sender_tenant_id,
          recipient_tenant_id,
          status,
          created_at,
          updated_at
        FROM public.inbox_requests
        WHERE recipient_tenant_id = $1
        ORDER BY due_at ASC, created_at ASC
      `,
      [tenantId],
    );
    return rowsRes.rows.map((row) => this.mapRowToRecord(row));
  }

  async respond(id: string, tenantId: string): Promise<InboxRequestRecord> {
    if (!tenantId) {
      throw new BadRequestException('Authenticated tenant context is required.');
    }
    await this.seedIfEmpty();

    const updatedRes = await this.pool.query<{
      id: string;
      campaign_id: string;
      title: string;
      request_type: RequestType;
      due_at: Date | string;
      from_org: string;
      sender_tenant_id: string;
      recipient_tenant_id: string;
      status: InboxRequestStatus;
      created_at: Date | string;
      updated_at: Date | string;
    }>(
      `
        UPDATE public.inbox_requests
        SET status = 'RESPONDED', updated_at = NOW()
        WHERE id = $1
          AND recipient_tenant_id = $2
          AND status <> 'RESPONDED'
        RETURNING
          id,
          campaign_id,
          title,
          request_type,
          due_at,
          from_org,
          sender_tenant_id,
          recipient_tenant_id,
          status,
          created_at,
          updated_at
      `,
      [id, tenantId],
    );

    if (updatedRes.rowCount && updatedRes.rows[0]) {
      await this.pool.query(
        `
          INSERT INTO public.inbox_request_events (request_id, event_type, actor_tenant_id, payload)
          VALUES ($1, 'REQUEST_RESPONDED', $2, $3::jsonb)
        `,
        [id, tenantId, JSON.stringify({ respondedAt: new Date().toISOString() })],
      );
      await this.emitAuditEvent('inbox_request_responded', {
        requestId: id,
        tenantId,
        respondedAt: new Date().toISOString(),
      });
      return this.mapRowToRecord(updatedRes.rows[0]);
    }

    const existingRes = await this.pool.query<{
      id: string;
      campaign_id: string;
      title: string;
      request_type: RequestType;
      due_at: Date | string;
      from_org: string;
      sender_tenant_id: string;
      recipient_tenant_id: string;
      status: InboxRequestStatus;
      created_at: Date | string;
      updated_at: Date | string;
    }>(
      `
        SELECT
          id,
          campaign_id,
          title,
          request_type,
          due_at,
          from_org,
          sender_tenant_id,
          recipient_tenant_id,
          status,
          created_at,
          updated_at
        FROM public.inbox_requests
        WHERE id = $1
          AND recipient_tenant_id = $2
        LIMIT 1
      `,
      [id, tenantId],
    );

    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new NotFoundException('Request not found for tenant.');
    }
    return this.mapRowToRecord(existingRes.rows[0]);
  }

  async bootstrap(action: BootstrapAction): Promise<void> {
    const requests = this.requestsForAction(action);
    await this.upsertRequests(requests, action);
    await this.emitAuditEvent('inbox_requests_seeded', {
      action,
      requestCount: requests.length,
      writtenAt: new Date().toISOString(),
    });
  }
}
