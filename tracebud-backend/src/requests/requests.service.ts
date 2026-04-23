import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import { Resend } from 'resend';
import { PG_POOL } from '../db/db.module';

export type RequestType =
  | 'MISSING_PRODUCER_PROFILE'
  | 'MISSING_PLOT_GEOMETRY'
  | 'MISSING_LAND_TITLE'
  | 'MISSING_HARVEST_RECORD'
  | 'YIELD_EVIDENCE'
  | 'CONSENT_GRANT'
  | 'DDS_REFERENCE'
  | 'GENERAL_EVIDENCE'
  | 'OTHER';

export interface RequestCampaignRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  request_type: RequestType;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'EXPIRED' | 'CANCELLED';
  target_organization_ids: string[];
  target_farmer_ids: string[];
  target_plot_ids: string[];
  target_contact_emails: string[];
  due_at: string;
  reminder_sent_at: string | null;
  accepted_count: number;
  pending_count: number;
  expired_count: number;
  created_by: string;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestCampaignDecisionRecord {
  campaign_id: string;
  recipient_email: string;
  decision: 'accept' | 'refuse';
  decided_at: string;
  source: string;
}

type DecisionFilter = 'all' | 'accept' | 'refuse';

@Injectable()
export class RequestsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private mapDatabaseError(error: unknown): never {
    const pgError = error as { code?: string; message?: string } | null;
    const message = pgError?.message ?? '';
    if (pgError?.code === '42P01' && message.includes('request_campaigns')) {
      throw new BadRequestException(
        'Request campaign tables are not available. Apply TB-V16-025 migration first.',
      );
    }
    if (pgError?.code === '42703' && message.includes('target_contact_emails')) {
      throw new BadRequestException(
        'Request campaign contact email column is missing. Apply TB-V16-026 migration first.',
      );
    }
    if (pgError?.code === '42P01' && message.includes('request_campaign_recipient_decisions')) {
      throw new BadRequestException(
        'Request campaign decision ledger is not available. Apply TB-V16-027 migration first.',
      );
    }
    throw new InternalServerErrorException('Failed to process request campaigns.');
  }

  private mapRow(row: RequestCampaignRecord): RequestCampaignRecord {
    return {
      ...row,
      due_at: new Date(row.due_at).toISOString(),
      reminder_sent_at: row.reminder_sent_at ? new Date(row.reminder_sent_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  private getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new BadRequestException('RESEND_API_KEY is not configured.');
    }
    return new Resend(apiKey);
  }

  private getResendSender(): string {
    const sender = process.env.RESEND_FROM_EMAIL?.trim();
    if (!sender) {
      throw new BadRequestException('RESEND_FROM_EMAIL is not configured.');
    }
    return sender;
  }

  private getResendSenderName(): string {
    return process.env.RESEND_FROM_NAME?.trim() || 'Tracebud';
  }

  private async getRequestingOrganizationLabel(campaign: RequestCampaignRecord): Promise<string> {
    try {
      const orgResult = await this.pool.query<{ name: string }>(
        `
          SELECT name
          FROM admin_organizations
          WHERE tenant_id = $1
            AND status = 'ACTIVE'
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [campaign.tenant_id],
      );
      const organizationName = orgResult.rows[0]?.name?.trim();
      if (organizationName) {
        return organizationName;
      }
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code !== '42P01') {
        throw error;
      }
      // If admin_organizations table does not exist in this environment yet, fall back.
    }
    return process.env.RESEND_REQUEST_ORGANIZATION_NAME?.trim() || campaign.tenant_id || 'Tracebud organization';
  }

  private getDashboardBaseUrl(): string {
    const raw = process.env.TRACEBUD_DASHBOARD_PUBLIC_URL?.trim();
    return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://app.tracebud.com';
  }

  private getDocsBaseUrl(): string {
    const raw = process.env.TRACEBUD_DOCS_PUBLIC_URL?.trim();
    return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://docs.tracebud.com';
  }

  private getDecisionSecret(): string {
    const secret = process.env.RESEND_DECISION_SECRET?.trim();
    if (!secret) {
      throw new BadRequestException('RESEND_DECISION_SECRET is not configured.');
    }
    return secret;
  }

  private signDecisionToken(campaignId: string, recipientEmail: string): string {
    const secret = this.getDecisionSecret();
    return createHmac('sha256', secret)
      .update(`${campaignId}:${recipientEmail.toLowerCase()}`)
      .digest('hex');
  }

  private verifyDecisionToken(campaignId: string, recipientEmail: string, token: string): boolean {
    const expected = this.signDecisionToken(campaignId, recipientEmail);
    const provided = token.trim().toLowerCase();
    if (expected.length !== provided.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  }

  private getResendReplyTo(defaultSender: string): string {
    return process.env.RESEND_REPLY_TO_EMAIL?.trim() || defaultSender;
  }

  private async dispatchCampaignEmails(campaign: RequestCampaignRecord): Promise<{
    sentCount: number;
    failedCount: number;
    failureMessages: string[];
  }> {
    const recipients = campaign.target_contact_emails ?? [];
    if (recipients.length === 0) {
      throw new BadRequestException('Draft campaign has no contact emails to send.');
    }
    const resend = this.getResendClient();
    const senderEmail = this.getResendSender();
    const senderName = this.getResendSenderName();
    const from = `${senderName} <${senderEmail}>`;
    const replyTo = this.getResendReplyTo(from);
    const requestingOrganization = await this.getRequestingOrganizationLabel(campaign);
    const dashboardBaseUrl = this.getDashboardBaseUrl();
    const docsBaseUrl = this.getDocsBaseUrl();
    const dueDateLabel = new Date(campaign.due_at).toLocaleDateString();
    const subject = `Request from ${requestingOrganization}: ${campaign.title}`;

    const deliveries = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const acceptUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaign.id)}&decision=accept`;
        const decisionToken = this.signDecisionToken(campaign.id, recipient);
        const refuseUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaign.id)}&decision=refuse`;
        const connectUrl = `${dashboardBaseUrl}/login?next=/requests&campaign=${encodeURIComponent(campaign.id)}`;
        const docsUrl = `${docsBaseUrl}/getting-started/compliance-requests`;
        const acceptUrlWithToken = `${acceptUrl}&recipient=${encodeURIComponent(recipient)}&token=${decisionToken}`;
        const refuseUrlWithToken = `${refuseUrl}&recipient=${encodeURIComponent(recipient)}&token=${decisionToken}`;
        const result = await resend.emails.send({
          from,
          to: recipient,
          replyTo,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:640px">
              <h2 style="margin-bottom:8px;">Evidence request from ${requestingOrganization}</h2>
              <p style="margin:0 0 12px 0;">
                ${campaign.description || 'To stay compliant and continue business flows, your organization has been asked to provide supply-chain evidence through Tracebud.'}
              </p>
              <p style="margin:0 0 12px 0;">
                <strong>Request:</strong> ${campaign.title}<br />
                <strong>Due date:</strong> ${dueDateLabel}
              </p>
              <p style="margin:0 0 12px 0;">
                You can connect to Tracebud, open an account, and start with a free 1-month trial to upload the required evidence and document formats.
              </p>
              <p style="margin:0 0 12px 0;">
                If this request is from an importer to an exporter, the exporter can then continue the evidence chain by requesting the required documents from farmers/cooperatives inside Tracebud.
              </p>
              <div style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap">
                <a
                  href="${acceptUrlWithToken}"
                  style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:600"
                >
                  Accept
                </a>
                <a
                  href="${refuseUrlWithToken}"
                  style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:600"
                >
                  Refuse
                </a>
                <a
                  href="${connectUrl}"
                  style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:600"
                >
                  Connect and start your compliance journey
                </a>
              </div>
              <p style="margin:0 0 8px 0;">
                Need help? Read the setup guide:
                <a href="${docsUrl}" style="color:#1d4ed8">Tracebud documentation</a>.
              </p>
              <p style="margin:0;color:#4b5563;font-size:12px">
                If buttons do not open directly, copy this link into your browser: ${connectUrl}
              </p>
            </div>
          `,
        });
        if (result.error) {
          throw new Error(`Resend rejected ${recipient}: ${result.error.message}`);
        }
        if (!result.data?.id) {
          throw new Error(`Resend did not return message id for ${recipient}.`);
        }
        return result.data.id;
      }),
    );

    const sentCount = deliveries.filter((entry) => entry.status === 'fulfilled').length;
    const failedCount = deliveries.length - sentCount;
    const failureMessages = deliveries
      .filter((entry): entry is PromiseRejectedResult => entry.status === 'rejected')
      .map((entry) => (entry.reason instanceof Error ? entry.reason.message : String(entry.reason)));
    return { sentCount, failedCount, failureMessages };
  }

  private async syncTargetsToContacts(
    tenantId: string,
    targets: Array<{
      email?: string | null;
      full_name?: string | null;
      organization?: string | null;
      farmer_id?: string | null;
      plot_id?: string | null;
    }>,
  ): Promise<void> {
    const uniqueByEmail = new Map<
      string,
      {
        email: string;
        fullName: string;
        organization: string | null;
        contactType: 'exporter' | 'cooperative' | 'farmer' | 'other';
      }
    >();

    for (const target of targets) {
      const email = target.email?.trim().toLowerCase();
      const fullName = target.full_name?.trim();
      if (!email || !fullName) continue;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      const inferredType: 'exporter' | 'cooperative' | 'farmer' | 'other' = target.farmer_id
        ? 'farmer'
        : target.organization
          ? 'cooperative'
          : 'other';
      uniqueByEmail.set(email, {
        email,
        fullName,
        organization: target.organization?.trim() || null,
        contactType: inferredType,
      });
    }

    if (uniqueByEmail.size === 0) return;

    const values = Array.from(uniqueByEmail.values());
    for (const value of values) {
      await this.pool.query(
        `
          INSERT INTO crm_contacts (
            id,
            tenant_id,
            full_name,
            email,
            phone,
            organization,
            contact_type,
            status,
            country,
            tags,
            consent_status
          )
          VALUES ($1, $2, $3, $4, NULL, $5, $6, 'invited', NULL, ARRAY[]::text[], 'unknown')
          ON CONFLICT (tenant_id, email)
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            organization = COALESCE(EXCLUDED.organization, crm_contacts.organization),
            contact_type = EXCLUDED.contact_type,
            status = CASE
              WHEN crm_contacts.status IN ('new', 'inactive') THEN 'invited'
              ELSE crm_contacts.status
            END,
            updated_at = NOW()
        `,
        [
          `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tenantId,
          value.fullName,
          value.email,
          value.organization,
          value.contactType,
        ],
      );
    }
  }

  async list(tenantId: string): Promise<RequestCampaignRecord[]> {
    try {
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          SELECT *
          FROM request_campaigns
          WHERE tenant_id = $1
          ORDER BY created_at DESC
        `,
        [tenantId],
      );
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async listDecisions(
    tenantId: string,
    campaignId: string,
    options?: {
      decision?: DecisionFilter;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    campaign_id: string;
    tenant_id: string;
    last_synced_at: string | null;
    decisions: RequestCampaignDecisionRecord[];
    counts: {
      all: number;
      accept: number;
      refuse: number;
    };
    pagination: {
      decision: DecisionFilter;
      limit: number;
      offset: number;
      returned: number;
      has_more: boolean;
    };
  }> {
    try {
      const decisionFilter: DecisionFilter =
        options?.decision === 'accept' || options?.decision === 'refuse' ? options.decision : 'all';
      const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
      const offset = Math.max(options?.offset ?? 0, 0);
      const campaignResult = await this.pool.query<{ id: string; tenant_id: string }>(
        `
          SELECT id, tenant_id
          FROM request_campaigns
          WHERE tenant_id = $1
            AND id = $2
          LIMIT 1
        `,
        [tenantId, campaignId],
      );
      if (!campaignResult.rows[0]) {
        throw new BadRequestException('Campaign not found.');
      }

      const countResult = await this.pool.query<{
        all_count: string;
        accept_count: string;
        refuse_count: string;
      }>(
        `
          SELECT
            COUNT(*)::text AS all_count,
            COUNT(*) FILTER (WHERE decision = 'accept')::text AS accept_count,
            COUNT(*) FILTER (WHERE decision = 'refuse')::text AS refuse_count
          FROM request_campaign_recipient_decisions decision
          INNER JOIN request_campaigns campaign
            ON campaign.id = decision.campaign_id
          WHERE campaign.tenant_id = $1
            AND decision.campaign_id = $2
        `,
        [tenantId, campaignId],
      );
      const counts = {
        all: Number(countResult.rows[0]?.all_count ?? 0),
        accept: Number(countResult.rows[0]?.accept_count ?? 0),
        refuse: Number(countResult.rows[0]?.refuse_count ?? 0),
      };

      const hasDecisionFilter = decisionFilter !== 'all';
      const decisionResult = await this.pool.query<RequestCampaignDecisionRecord>(
        `
          SELECT
            decision.campaign_id,
            decision.recipient_email,
            decision.decision,
            decision.decided_at,
            decision.source
          FROM request_campaign_recipient_decisions decision
          INNER JOIN request_campaigns campaign
            ON campaign.id = decision.campaign_id
          WHERE campaign.tenant_id = $1
            AND decision.campaign_id = $2
            ${hasDecisionFilter ? "AND decision.decision = $3" : ''}
          ORDER BY decision.decided_at DESC
          LIMIT $${hasDecisionFilter ? '4' : '3'}
          OFFSET $${hasDecisionFilter ? '5' : '4'}
        `,
        hasDecisionFilter
          ? [tenantId, campaignId, decisionFilter, limit, offset]
          : [tenantId, campaignId, limit, offset],
      );

      const decisions = decisionResult.rows.map((row) => ({
        ...row,
        decided_at: new Date(row.decided_at).toISOString(),
      }));
      const totalForFilter =
        decisionFilter === 'accept'
          ? counts.accept
          : decisionFilter === 'refuse'
            ? counts.refuse
            : counts.all;
      const hasMore = offset + decisions.length < totalForFilter;

      return {
        campaign_id: campaignId,
        tenant_id: tenantId,
        last_synced_at: decisions[0]?.decided_at ?? null,
        decisions,
        counts,
        pagination: {
          decision: decisionFilter,
          limit,
          offset,
          returned: decisions.length,
          has_more: hasMore,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async create(
    tenantId: string,
    actorUserId: string,
    idempotencyKey: string | null,
    input: {
      request_type?: RequestType;
      campaign_name?: string;
      description_template?: string;
      due_date?: string;
      targets?: Array<{
        email?: string | null;
        full_name?: string | null;
        organization?: string | null;
        farmer_id?: string | null;
        plot_id?: string | null;
      }>;
    },
  ): Promise<{ campaign_id: string; campaign: RequestCampaignRecord }> {
    const campaignName = input.campaign_name?.trim();
    const dueDate = input.due_date?.trim();
    if (!campaignName || !dueDate) {
      throw new BadRequestException('campaign_name and due_date are required');
    }
    const requestType = input.request_type ?? 'GENERAL_EVIDENCE';
    const targets = Array.isArray(input.targets) ? input.targets : [];
    const targetOrganizationIds = targets
      .map((target) => target.organization?.trim())
      .filter((value): value is string => Boolean(value));
    const targetFarmerIds = targets
      .map((target) => target.farmer_id?.trim())
      .filter((value): value is string => Boolean(value));
    const targetPlotIds = targets
      .map((target) => target.plot_id?.trim())
      .filter((value): value is string => Boolean(value));
    const targetContactEmails = targets
      .map((target) => target.email?.trim().toLowerCase() ?? '')
      .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

    try {
      if (idempotencyKey) {
        const existing = await this.pool.query<RequestCampaignRecord>(
          `
            SELECT *
            FROM request_campaigns
            WHERE tenant_id = $1 AND idempotency_key = $2
            LIMIT 1
          `,
          [tenantId, idempotencyKey],
        );
        if (existing.rows[0]) {
          const campaign = this.mapRow(existing.rows[0]);
          return { campaign_id: campaign.id, campaign };
        }
      }

      const result = await this.pool.query<RequestCampaignRecord>(
        `
          INSERT INTO request_campaigns (
            id,
            tenant_id,
            title,
            description,
            request_type,
            status,
            target_organization_ids,
            target_farmer_ids,
            target_plot_ids,
            target_contact_emails,
            due_at,
            reminder_sent_at,
            accepted_count,
            pending_count,
            expired_count,
            created_by,
            idempotency_key
          )
          VALUES (
            $1, $2, $3, $4, $5, 'DRAFT', $6::text[], $7::text[], $8::text[], $9::text[], $10::timestamptz, NULL, 0, 0, 0, $11, $12
          )
          RETURNING *
        `,
        [
          `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tenantId,
          campaignName,
          input.description_template?.trim() ?? '',
          requestType,
          targetOrganizationIds,
          targetFarmerIds,
          targetPlotIds,
          targetContactEmails,
          dueDate,
          actorUserId,
          idempotencyKey,
        ],
      );
      const campaign = this.mapRow(result.rows[0]);
      // Keep campaign creation and CRM contact visibility aligned by upserting campaign targets.
      await this.syncTargetsToContacts(tenantId, targets);
      return { campaign_id: campaign.id, campaign };
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async updateDraft(
    tenantId: string,
    campaignId: string,
    input: {
      request_type?: RequestType;
      campaign_name?: string;
      description_template?: string;
      due_date?: string;
      targets?: Array<{
        email?: string | null;
        full_name?: string | null;
        organization?: string | null;
        farmer_id?: string | null;
        plot_id?: string | null;
      }>;
    },
  ): Promise<{ campaign_id: string; campaign: RequestCampaignRecord }> {
    const campaignName = input.campaign_name?.trim();
    const dueDate = input.due_date?.trim();
    if (!campaignName || !dueDate) {
      throw new BadRequestException('campaign_name and due_date are required');
    }
    const requestType = input.request_type ?? 'GENERAL_EVIDENCE';
    const targets = Array.isArray(input.targets) ? input.targets : [];
    const targetOrganizationIds = targets
      .map((target) => target.organization?.trim())
      .filter((value): value is string => Boolean(value));
    const targetFarmerIds = targets
      .map((target) => target.farmer_id?.trim())
      .filter((value): value is string => Boolean(value));
    const targetPlotIds = targets
      .map((target) => target.plot_id?.trim())
      .filter((value): value is string => Boolean(value));
    const targetContactEmails = targets
      .map((target) => target.email?.trim().toLowerCase() ?? '')
      .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

    try {
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          UPDATE request_campaigns
          SET
            title = $1,
            description = $2,
            request_type = $3,
            target_organization_ids = $4::text[],
            target_farmer_ids = $5::text[],
            target_plot_ids = $6::text[],
            target_contact_emails = $7::text[],
            due_at = $8::timestamptz,
            updated_at = NOW()
          WHERE tenant_id = $9
            AND id = $10
            AND status = 'DRAFT'
          RETURNING *
        `,
        [
          campaignName,
          input.description_template?.trim() ?? '',
          requestType,
          targetOrganizationIds,
          targetFarmerIds,
          targetPlotIds,
          targetContactEmails,
          dueDate,
          tenantId,
          campaignId,
        ],
      );
      if (!result.rows[0]) {
        throw new BadRequestException('Draft campaign not found or no longer editable.');
      }
      const campaign = this.mapRow(result.rows[0]);
      await this.syncTargetsToContacts(tenantId, targets);
      return { campaign_id: campaign.id, campaign };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async sendDraft(
    tenantId: string,
    campaignId: string,
  ): Promise<{ campaign_id: string; campaign: RequestCampaignRecord }> {
    try {
      const currentResult = await this.pool.query<RequestCampaignRecord>(
        `
          SELECT *
          FROM request_campaigns
          WHERE tenant_id = $1
            AND id = $2
            AND status = 'DRAFT'
          LIMIT 1
        `,
        [tenantId, campaignId],
      );
      const current = currentResult.rows[0];
      if (!current) {
        throw new BadRequestException('Draft campaign not found or already sent.');
      }
      const recipientCount = current.target_contact_emails?.length ?? 0;
      if (recipientCount === 0) {
        throw new BadRequestException(
          'This campaign has no recipient emails. Edit the draft and add at least one contact email before sending.',
        );
      }
      const delivery = await this.dispatchCampaignEmails(current);
      if (delivery.sentCount === 0) {
        const reason = delivery.failureMessages[0];
        throw new BadRequestException(
          reason
            ? `No campaign emails were delivered. ${reason}`
            : 'No campaign emails were delivered. Check recipient addresses and Resend setup.',
        );
      }
      const nextPendingCount = delivery.sentCount;
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          UPDATE request_campaigns
          SET
            status = 'RUNNING',
            pending_count = $3,
            updated_at = NOW()
          WHERE tenant_id = $1
            AND id = $2
            AND status = 'DRAFT'
          RETURNING *
        `,
        [tenantId, campaignId, nextPendingCount],
      );
      if (!result.rows[0]) {
        throw new BadRequestException('Draft campaign not found or already sent.');
      }
      const campaign = this.mapRow(result.rows[0]);
      return { campaign_id: campaign.id, campaign };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async archiveCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<{ campaign_id: string; campaign: RequestCampaignRecord }> {
    try {
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          UPDATE request_campaigns
          SET
            status = 'CANCELLED',
            updated_at = NOW()
          WHERE tenant_id = $1
            AND id = $2
            AND status <> 'CANCELLED'
          RETURNING *
        `,
        [tenantId, campaignId],
      );
      if (!result.rows[0]) {
        throw new BadRequestException('Campaign not found or already archived.');
      }
      const campaign = this.mapRow(result.rows[0]);
      return { campaign_id: campaign.id, campaign };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async recordDecisionIntent(
    tenantId: string,
    campaignId: string,
    decision: 'accept' | 'refuse',
  ): Promise<{
    campaign_id: string;
    tenant_id: string;
    decision: 'accept' | 'refuse';
    recorded: true;
    campaign: RequestCampaignRecord;
  }> {
    try {
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          UPDATE request_campaigns
          SET
            accepted_count = CASE
              WHEN $3 = 'accept' AND pending_count > 0 THEN accepted_count + 1
              ELSE accepted_count
            END,
            expired_count = CASE
              WHEN $3 = 'refuse' AND pending_count > 0 THEN expired_count + 1
              ELSE expired_count
            END,
            pending_count = CASE
              WHEN pending_count > 0 THEN pending_count - 1
              ELSE pending_count
            END,
            status = CASE
              WHEN status = 'RUNNING' AND pending_count <= 1 THEN
                CASE
                  WHEN ($3 = 'refuse' AND (accepted_count + 1) > 0) OR ($3 = 'accept' AND expired_count > 0)
                    THEN 'PARTIAL'
                  WHEN $3 = 'accept' THEN 'COMPLETED'
                  WHEN $3 = 'refuse' THEN 'EXPIRED'
                  ELSE status
                END
              ELSE status
            END,
            updated_at = NOW()
          WHERE tenant_id = $1
            AND id = $2
            AND status IN ('RUNNING', 'PARTIAL')
          RETURNING *
        `,
        [tenantId, campaignId, decision],
      );
      if (!result.rows[0]) {
        const existing = await this.pool.query<{ id: string; tenant_id: string }>(
          `
          SELECT id, tenant_id
          FROM request_campaigns
          WHERE tenant_id = $1
            AND id = $2
          LIMIT 1
        `,
          [tenantId, campaignId],
        );
        if (!existing.rows[0]) {
          throw new BadRequestException('Campaign not found for decision intent recording.');
        }
        throw new BadRequestException('Decision intent can only be recorded for active campaigns.');
      }
      const campaign = this.mapRow(result.rows[0]);
      return {
        campaign_id: campaignId,
        tenant_id: tenantId,
        decision,
        recorded: true,
        campaign,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async recordDecisionIntentPublic(input: {
    campaignId: string;
    recipientEmail: string;
    decision: 'accept' | 'refuse';
    token: string;
  }): Promise<{
    campaign_id: string;
    decision: 'accept' | 'refuse';
    recorded: true;
    campaign: RequestCampaignRecord;
  }> {
    const recipientEmail = input.recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new BadRequestException('recipientEmail must be a valid email.');
    }
    if (!this.verifyDecisionToken(input.campaignId, recipientEmail, input.token)) {
      throw new BadRequestException('Invalid decision token.');
    }
    const insertedDecision = await this.pool.query(
      `
        INSERT INTO request_campaign_recipient_decisions (
          campaign_id,
          recipient_email,
          decision,
          source
        )
        VALUES ($1, $2, $3, 'email_cta')
        ON CONFLICT (campaign_id, recipient_email) DO NOTHING
        RETURNING campaign_id
      `,
      [input.campaignId, recipientEmail, input.decision],
    );
    if (!insertedDecision.rows[0]) {
      throw new BadRequestException('Decision already recorded for this recipient.');
    }
    const updated = await this.pool.query<RequestCampaignRecord>(
      `
        UPDATE request_campaigns
        SET
          accepted_count = CASE WHEN $2 = 'accept' THEN accepted_count + 1 ELSE accepted_count END,
          expired_count = CASE WHEN $2 = 'refuse' THEN expired_count + 1 ELSE expired_count END,
          pending_count = CASE WHEN pending_count > 0 THEN pending_count - 1 ELSE pending_count END,
          status = CASE
            WHEN status IN ('RUNNING', 'PARTIAL') AND pending_count <= 1 THEN
              CASE
                WHEN $2 = 'accept' AND expired_count = 0 THEN 'COMPLETED'
                WHEN $2 = 'refuse' AND accepted_count = 0 THEN 'EXPIRED'
                ELSE 'PARTIAL'
              END
            ELSE status
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [input.campaignId, input.decision],
    );
    if (!updated.rows[0]) {
      throw new BadRequestException('Campaign not found for decision intent recording.');
    }
    return {
      campaign_id: input.campaignId,
      decision: input.decision,
      recorded: true,
      campaign: this.mapRow(updated.rows[0]),
    };
  }
}

