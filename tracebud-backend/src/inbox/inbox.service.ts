import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { markCrmContactSubmittedOnFulfill } from '../contacts/mark-crm-contact-submitted-on-fulfill';
import { PG_POOL } from '../db/db.module';
import { resolveTenantIdsByEmails } from '../network/email-to-tenant-resolution';
import { GOLDEN_STAGING_TENANT } from '../testing/golden-staging-tenant.constants';

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

export type CampaignInboxFanOutInput = {
  id: string;
  tenant_id: string;
  title: string;
  request_type: string;
  due_at: string;
  target_contact_emails: string[];
};

export type CampaignInboxFanOutResult = {
  created: number;
  skippedUnresolved: number;
  skippedSelfTenant: number;
};

export type InboxRespondInput = {
  notes?: string;
  evidencePlotIds?: string[];
  evidencePackageIds?: string[];
};

export type InboxRespondAuditPayload = {
  respondedAt: string;
  notes?: string;
  evidencePlotIds: string[];
  evidencePackageIds: string[];
  respondedByUserId?: string;
};

@Injectable()
export class InboxService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

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
    const { recipientTenantId, senderTenantId, goldenInboxRequestIds, goldenCampaignIds } =
      GOLDEN_STAGING_TENANT;
    return [
      {
        id: goldenInboxRequestIds[0],
        campaign_id: goldenCampaignIds[0],
        title: 'Upload updated FPIC packet',
        request_type: 'CONSENT_GRANT',
        due_at: '2026-04-15T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: senderTenantId,
        recipient_tenant_id: recipientTenantId,
        status: 'RESPONDED',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: goldenInboxRequestIds[1],
        campaign_id: goldenCampaignIds[1],
        title: 'Confirm missing plot geometry evidence',
        request_type: 'MISSING_PLOT_GEOMETRY',
        due_at: '2026-04-12T23:59:59Z',
        from_org: 'Great Lakes Exporters',
        sender_tenant_id: senderTenantId,
        recipient_tenant_id: recipientTenantId,
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

  private async ensureInboxTables(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS inbox_requests (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        title TEXT NOT NULL,
        request_type TEXT NOT NULL CHECK (
          request_type IN ('MISSING_PLOT_GEOMETRY', 'GENERAL_EVIDENCE', 'CONSENT_GRANT')
        ),
        due_at TIMESTAMPTZ NOT NULL,
        from_org TEXT NOT NULL,
        sender_tenant_id TEXT NOT NULL,
        recipient_tenant_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'RESPONDED')),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS inbox_request_events (
        id BIGSERIAL PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES inbox_requests(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor_tenant_id TEXT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async upsertRequests(requests: InboxRequestRecord[], action: BootstrapAction | 'auto_init'): Promise<void> {
    await this.ensureInboxTables();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM inbox_request_events');
      await client.query('DELETE FROM inbox_requests');

      for (const request of requests) {
        await client.query(
          `
            INSERT INTO inbox_requests (
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
            INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
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
    let countRes;
    try {
      countRes = await this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM inbox_requests');
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
      await this.ensureInboxTables();
      countRes = await this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM inbox_requests');
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
    let rowsRes;
    try {
      rowsRes = await this.pool.query<{
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
          FROM inbox_requests
          WHERE recipient_tenant_id = $1
          ORDER BY due_at ASC, created_at ASC
        `,
        [tenantId],
      );
    } catch (error: any) {
      if (error?.code === '42P01') {
        await this.ensureInboxTables();
        await this.seedIfEmpty();
        rowsRes = await this.pool.query<{
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
            FROM inbox_requests
            WHERE recipient_tenant_id = $1
            ORDER BY due_at ASC, created_at ASC
          `,
          [tenantId],
        );
      } else {
        throw error;
      }
    }
    return rowsRes.rows.map((row) => this.mapRowToRecord(row));
  }

  async respond(
    id: string,
    tenantId: string,
    input?: InboxRespondInput,
    respondedByUserId?: string | null,
  ): Promise<InboxRequestRecord> {
    if (!tenantId) {
      throw new BadRequestException('Authenticated tenant context is required.');
    }
    await this.seedIfEmpty();

    const responsePayload = this.buildRespondAuditPayload(input, respondedByUserId);

    let updatedRes;
    try {
      updatedRes = await this.pool.query<{
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
          UPDATE inbox_requests
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
    } catch (error: any) {
      if (error?.code === '42P01') {
        updatedRes = await this.pool.query<{
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
            UPDATE inbox_requests
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
      } else {
        throw error;
      }
    }

    if (updatedRes.rowCount && updatedRes.rows[0]) {
      try {
        await this.pool.query(
          `
            INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
            VALUES ($1, 'REQUEST_RESPONDED', $2, $3::jsonb)
          `,
          [id, tenantId, JSON.stringify(responsePayload)],
        );
      } catch (error: any) {
        if (error?.code === '42P01') {
          // Table may have been dropped between list/respond in integration tests; self-heal once.
          await this.pool.query(
            `
              INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
              VALUES ($1, 'REQUEST_RESPONDED', $2, $3::jsonb)
            `,
            [id, tenantId, JSON.stringify(responsePayload)],
          );
        } else {
          throw error;
        }
      }
      await this.emitRespondAuditEvents(id, tenantId, updatedRes.rows[0], responsePayload);
      await this.reconcileSenderCampaignOnFulfillment({
        campaignId: updatedRes.rows[0].campaign_id,
        senderTenantId: updatedRes.rows[0].sender_tenant_id,
        recipientTenantId: tenantId,
        recipientUserId: respondedByUserId,
        responsePayload,
      });
      return this.mapRowToRecord(updatedRes.rows[0]);
    }

    let existingRes;
    try {
      existingRes = await this.pool.query<{
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
          FROM inbox_requests
          WHERE id = $1
            AND recipient_tenant_id = $2
          LIMIT 1
        `,
        [id, tenantId],
      );
    } catch (error: any) {
      if (error?.code === '42P01') {
        existingRes = await this.pool.query<{
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
            FROM inbox_requests
            WHERE id = $1
              AND recipient_tenant_id = $2
            LIMIT 1
          `,
          [id, tenantId],
        );
      } else {
        throw error;
      }
    }

    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new NotFoundException('Request not found for tenant.');
    }
    return this.mapRowToRecord(existingRes.rows[0]);
  }

  private buildRespondAuditPayload(
    input: InboxRespondInput | undefined,
    respondedByUserId?: string | null,
  ): InboxRespondAuditPayload {
    const notes = input?.notes?.trim();
    const evidencePlotIds = Array.from(
      new Set((input?.evidencePlotIds ?? []).map((value) => value.trim()).filter(Boolean)),
    );
    const evidencePackageIds = Array.from(
      new Set((input?.evidencePackageIds ?? []).map((value) => value.trim()).filter(Boolean)),
    );

    return {
      respondedAt: new Date().toISOString(),
      ...(notes ? { notes } : {}),
      evidencePlotIds,
      evidencePackageIds,
      ...(respondedByUserId ? { respondedByUserId } : {}),
    };
  }

  private async emitRespondAuditEvents(
    requestId: string,
    tenantId: string,
    row: {
      campaign_id: string;
      sender_tenant_id: string;
    },
    responsePayload: InboxRespondAuditPayload,
  ): Promise<void> {
    await this.emitAuditEvent('inbox_request_responded', {
      requestId,
      campaignId: row.campaign_id,
      senderTenantId: row.sender_tenant_id,
      tenantId,
      ...responsePayload,
    });

    if (responsePayload.evidencePlotIds.length > 0 || responsePayload.evidencePackageIds.length > 0) {
      await this.emitAuditEvent('inbox_request_evidence_attached', {
        requestId,
        campaignId: row.campaign_id,
        tenantId,
        evidencePlotIds: responsePayload.evidencePlotIds,
        evidencePackageIds: responsePayload.evidencePackageIds,
        attachedAt: responsePayload.respondedAt,
      });
    }
  }

  private async resolveRecipientEmailForTenant(
    tenantId: string,
    userId?: string | null,
  ): Promise<string | null> {
    try {
      if (userId) {
        const byUser = await this.pool.query<{ email: string }>(
          `
            SELECT LOWER(email) AS email
            FROM tenant_signup_contacts
            WHERE tenant_id = $1
              AND user_id = $2
            ORDER BY updated_at DESC NULLS LAST
            LIMIT 1
          `,
          [tenantId, userId],
        );
        if (byUser.rows[0]?.email) {
          return byUser.rows[0].email;
        }
      }

      const fallback = await this.pool.query<{ email: string }>(
        `
          SELECT LOWER(email) AS email
          FROM tenant_signup_contacts
          WHERE tenant_id = $1
          ORDER BY updated_at DESC NULLS LAST
          LIMIT 1
        `,
        [tenantId],
      );
      return fallback.rows[0]?.email ?? null;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  private async reconcileSenderCampaignOnFulfillment(input: {
    campaignId: string;
    senderTenantId: string;
    recipientTenantId: string;
    recipientUserId?: string | null;
    responsePayload: InboxRespondAuditPayload;
  }): Promise<void> {
    const recipientEmail = await this.resolveRecipientEmailForTenant(
      input.recipientTenantId,
      input.recipientUserId,
    );
    if (!recipientEmail) {
      return;
    }

    await markCrmContactSubmittedOnFulfill(this.pool, {
      senderTenantId: input.senderTenantId,
      recipientEmail,
      source: 'inbox_fulfillment',
      campaignId: input.campaignId,
    });

    let insertedDecision = false;
    try {
      const decisionRes = await this.pool.query<{ campaign_id: string }>(
        `
          INSERT INTO request_campaign_recipient_decisions (
            campaign_id,
            recipient_email,
            decision,
            source
          )
          VALUES ($1, $2, 'accept', 'inbox_fulfillment')
          ON CONFLICT (campaign_id, recipient_email) DO NOTHING
          RETURNING campaign_id
        `,
        [input.campaignId, recipientEmail],
      );
      insertedDecision = Boolean(decisionRes.rows[0]?.campaign_id);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return;
      }
      throw error;
    }

    if (!insertedDecision) {
      return;
    }

    try {
      await this.pool.query(
        `
          UPDATE request_campaigns
          SET
            accepted_count = accepted_count + 1,
            pending_count = CASE WHEN pending_count > 0 THEN pending_count - 1 ELSE pending_count END,
            status = CASE
              WHEN status IN ('RUNNING', 'PARTIAL') AND pending_count <= 1 THEN
                CASE
                  WHEN expired_count > 0 THEN 'PARTIAL'
                  ELSE 'COMPLETED'
                END
              ELSE status
            END,
            updated_at = NOW()
          WHERE tenant_id = $1
            AND id = $2
            AND status IN ('RUNNING', 'PARTIAL')
        `,
        [input.senderTenantId, input.campaignId],
      );
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return;
      }
      throw error;
    }

    await this.emitAuditEvent('inbox_request_campaign_reconciled', {
      campaignId: input.campaignId,
      senderTenantId: input.senderTenantId,
      recipientTenantId: input.recipientTenantId,
      recipientEmail,
      evidencePlotIds: input.responsePayload.evidencePlotIds,
      evidencePackageIds: input.responsePayload.evidencePackageIds,
      reconciledAt: input.responsePayload.respondedAt,
    });
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

  private mapCampaignTypeToInboxType(requestType: string): RequestType {
    const normalized = requestType.trim().toUpperCase();
    if (normalized === 'MISSING_PLOT_GEOMETRY') {
      return 'MISSING_PLOT_GEOMETRY';
    }
    if (normalized === 'CONSENT_GRANT') {
      return 'CONSENT_GRANT';
    }
    return 'GENERAL_EVIDENCE';
  }

  private async resolveRecipientTenantsByEmail(emails: string[]): Promise<Map<string, string>> {
    return resolveTenantIdsByEmails(this.pool, emails);
  }

  async fanOutFromCampaignSend(input: {
    campaign: CampaignInboxFanOutInput;
    fromOrg: string;
  }): Promise<CampaignInboxFanOutResult> {
    const emails = Array.from(
      new Set(
        (input.campaign.target_contact_emails ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      ),
    );

    if (emails.length === 0) {
      return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
    }

    const tenantByEmail = await this.resolveRecipientTenantsByEmail(emails);
    const recipientTenantIds = new Set<string>();
    let skippedUnresolved = 0;
    let skippedSelfTenant = 0;

    for (const email of emails) {
      const recipientTenantId = tenantByEmail.get(email);
      if (!recipientTenantId) {
        skippedUnresolved += 1;
        continue;
      }
      if (recipientTenantId === input.campaign.tenant_id) {
        skippedSelfTenant += 1;
        continue;
      }
      recipientTenantIds.add(recipientTenantId);
    }

    const inboxRequestType = this.mapCampaignTypeToInboxType(input.campaign.request_type);
    const title = input.campaign.title?.trim() || 'Compliance evidence request';
    const nowIso = new Date().toISOString();
    let created = 0;

    for (const recipientTenantId of recipientTenantIds) {
      const requestId = `req_${input.campaign.id}_${recipientTenantId}`;
      const insertResult = await this.pool.query<{ id: string }>(
        `
          INSERT INTO inbox_requests (
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
          VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, 'PENDING', $9::timestamptz, $10::timestamptz)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `,
        [
          requestId,
          input.campaign.id,
          title,
          inboxRequestType,
          input.campaign.due_at,
          input.fromOrg,
          input.campaign.tenant_id,
          recipientTenantId,
          nowIso,
          nowIso,
        ],
      );

      if (!insertResult.rows[0]?.id) {
        continue;
      }

      created += 1;
      await this.pool.query(
        `
          INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          requestId,
          'REQUEST_CREATED_FROM_CAMPAIGN',
          input.campaign.tenant_id,
          JSON.stringify({
            campaignId: input.campaign.id,
            recipientTenantId,
            requestType: inboxRequestType,
          }),
        ],
      );
    }

    await this.emitAuditEvent('inbox_requests_campaign_fanout', {
      campaignId: input.campaign.id,
      senderTenantId: input.campaign.tenant_id,
      created,
      skippedUnresolved,
      skippedSelfTenant,
      recipientTenantCount: recipientTenantIds.size,
      fanOutAt: nowIso,
    });

    return { created, skippedUnresolved, skippedSelfTenant };
  }

  async backfillInboxForSignupContact(input: {
    email: string;
    recipientTenantId: string;
  }): Promise<CampaignInboxFanOutResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
    }

    let campaigns: CampaignInboxFanOutInput[] = [];
    try {
      const campaignRes = await this.pool.query<CampaignInboxFanOutInput>(
        `
          SELECT
            id,
            tenant_id,
            title,
            request_type,
            due_at,
            target_contact_emails
          FROM request_campaigns
          WHERE status IN ('RUNNING', 'PARTIAL')
            AND tenant_id <> $2
            AND EXISTS (
              SELECT 1
              FROM unnest(target_contact_emails) AS target_email
              WHERE LOWER(target_email) = $1
            )
        `,
        [normalizedEmail, input.recipientTenantId],
      );
      campaigns = campaignRes.rows;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
      }
      throw error;
    }

    const nowIso = new Date().toISOString();
    let created = 0;

    for (const campaign of campaigns) {
      const fromOrg = await this.resolveSenderOrgName(campaign.tenant_id);
      const inboxRequestType = this.mapCampaignTypeToInboxType(campaign.request_type);
      const title = campaign.title?.trim() || 'Compliance evidence request';
      const requestId = `req_${campaign.id}_${input.recipientTenantId}`;
      const insertResult = await this.pool.query<{ id: string }>(
        `
          INSERT INTO inbox_requests (
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
          VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, 'PENDING', $9::timestamptz, $10::timestamptz)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `,
        [
          requestId,
          campaign.id,
          title,
          inboxRequestType,
          campaign.due_at,
          fromOrg,
          campaign.tenant_id,
          input.recipientTenantId,
          nowIso,
          nowIso,
        ],
      );

      if (!insertResult.rows[0]?.id) {
        continue;
      }

      created += 1;
      await this.pool.query(
        `
          INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          requestId,
          'REQUEST_CREATED_FROM_SIGNUP_BACKFILL',
          campaign.tenant_id,
          JSON.stringify({
            campaignId: campaign.id,
            recipientTenantId: input.recipientTenantId,
            requestType: inboxRequestType,
          }),
        ],
      );
    }

    if (created > 0) {
      await this.emitAuditEvent('inbox_requests_signup_backfill', {
        recipientTenantId: input.recipientTenantId,
        email: normalizedEmail,
        created,
        backfilledAt: nowIso,
      });
    }

    return { created, skippedUnresolved: 0, skippedSelfTenant: 0 };
  }


  async ensureInboxForCampaignRecipient(input: {
    campaignId: string;
    recipientTenantId: string;
  }): Promise<{ created: boolean }> {
    const campaignId = input.campaignId.trim();
    const recipientTenantId = input.recipientTenantId.trim();
    if (!campaignId || !recipientTenantId) {
      return { created: false };
    }

    let campaign: CampaignInboxFanOutInput | null = null;
    try {
      const campaignRes = await this.pool.query<CampaignInboxFanOutInput>(
        `
          SELECT
            id,
            tenant_id,
            title,
            request_type,
            due_at,
            target_contact_emails
          FROM request_campaigns
          WHERE id = $1
            AND status IN ('RUNNING', 'PARTIAL', 'COMPLETED')
          LIMIT 1
        `,
        [campaignId],
      );
      campaign = campaignRes.rows[0] ?? null;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return { created: false };
      }
      throw error;
    }

    if (!campaign || campaign.tenant_id === recipientTenantId) {
      return { created: false };
    }

    const fromOrg = await this.resolveSenderOrgName(campaign.tenant_id);
    const inboxRequestType = this.mapCampaignTypeToInboxType(campaign.request_type);
    const title = campaign.title?.trim() || 'Compliance evidence request';
    const requestId = `req_${campaign.id}_${recipientTenantId}`;
    const nowIso = new Date().toISOString();

    const insertResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO inbox_requests (
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
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, 'PENDING', $9::timestamptz, $10::timestamptz)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `,
      [
        requestId,
        campaign.id,
        title,
        inboxRequestType,
        campaign.due_at,
        fromOrg,
        campaign.tenant_id,
        recipientTenantId,
        nowIso,
        nowIso,
      ],
    );

    if (!insertResult.rows[0]?.id) {
      return { created: false };
    }

    await this.pool.query(
      `
        INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        requestId,
        'REQUEST_CREATED_FROM_CAMPAIGN_INVITE_CLAIM',
        campaign.tenant_id,
        JSON.stringify({
          campaignId: campaign.id,
          recipientTenantId,
          requestType: inboxRequestType,
        }),
      ],
    );

    return { created: true };
  }

  async ensureInboxFromEmailCtaAccept(input: {
    campaignId: string;
    recipientEmail: string;
  }): Promise<CampaignInboxFanOutResult> {
    const normalizedEmail = input.recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { created: 0, skippedUnresolved: 1, skippedSelfTenant: 0 };
    }

    let campaign: CampaignInboxFanOutInput | null = null;
    try {
      const campaignRes = await this.pool.query<CampaignInboxFanOutInput>(
        `
          SELECT
            id,
            tenant_id,
            title,
            request_type,
            due_at,
            target_contact_emails
          FROM request_campaigns
          WHERE id = $1
            AND status IN ('RUNNING', 'PARTIAL', 'COMPLETED')
          LIMIT 1
        `,
        [input.campaignId],
      );
      campaign = campaignRes.rows[0] ?? null;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
      }
      throw error;
    }

    if (!campaign) {
      return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
    }

    const isTargetRecipient = (campaign.target_contact_emails ?? []).some(
      (email) => email.trim().toLowerCase() === normalizedEmail,
    );
    if (!isTargetRecipient) {
      return { created: 0, skippedUnresolved: 1, skippedSelfTenant: 0 };
    }

    const tenantByEmail = await this.resolveRecipientTenantsByEmail([normalizedEmail]);
    const recipientTenantId = tenantByEmail.get(normalizedEmail);
    if (!recipientTenantId) {
      return { created: 0, skippedUnresolved: 1, skippedSelfTenant: 0 };
    }
    if (recipientTenantId === campaign.tenant_id) {
      return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 1 };
    }

    const fromOrg = await this.resolveSenderOrgName(campaign.tenant_id);
    const inboxRequestType = this.mapCampaignTypeToInboxType(campaign.request_type);
    const title = campaign.title?.trim() || 'Compliance evidence request';
    const requestId = `req_${campaign.id}_${recipientTenantId}`;
    const nowIso = new Date().toISOString();

    const insertResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO inbox_requests (
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
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, 'PENDING', $9::timestamptz, $10::timestamptz)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `,
      [
        requestId,
        campaign.id,
        title,
        inboxRequestType,
        campaign.due_at,
        fromOrg,
        campaign.tenant_id,
        recipientTenantId,
        nowIso,
        nowIso,
      ],
    );

    if (!insertResult.rows[0]?.id) {
      return { created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 };
    }

    await this.pool.query(
      `
        INSERT INTO inbox_request_events (request_id, event_type, actor_tenant_id, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        requestId,
        'REQUEST_CREATED_FROM_EMAIL_CTA_ACCEPT',
        campaign.tenant_id,
        JSON.stringify({
          campaignId: campaign.id,
          recipientTenantId,
          recipientEmail: normalizedEmail,
          requestType: inboxRequestType,
        }),
      ],
    );

    await this.emitAuditEvent('inbox_requests_email_cta_inbox_ensured', {
      campaignId: campaign.id,
      senderTenantId: campaign.tenant_id,
      recipientTenantId,
      recipientEmail: normalizedEmail,
      requestId,
      ensuredAt: nowIso,
    });

    return { created: 1, skippedUnresolved: 0, skippedSelfTenant: 0 };
  }

  private async resolveSenderOrgName(tenantId: string): Promise<string> {
    try {
      const res = await this.pool.query<{ organization_name: string | null }>(
        `
          SELECT organization_name
          FROM tenant_commercial_profiles
          WHERE tenant_id = $1
          LIMIT 1
        `,
        [tenantId],
      );
      return res.rows[0]?.organization_name?.trim() || 'Partner organization';
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return 'Partner organization';
      }
      throw error;
    }
  }
}
