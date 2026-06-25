import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createSupabaseServerClient } from '../auth/supabase-server.client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import { Resend } from 'resend';
import { ConsentService } from '../consent/consent.service';
import { PG_POOL } from '../db/db.module';
import { InboxService } from '../inbox/inbox.service';
import {
  dispatchCampaignRequestEmails,
  remindUnclaimedCampaignRecipientInvites,
  resolveCampaignRecipientContactTypes,
  resolveSenderPrimaryRole,
} from './campaign-request-email';
import { queueCampaignRecipientInvites } from './campaign-recipient-invite';
import {
  resolveCampaignTargetFields,
  type CampaignTargetInput,
} from './campaign-contact-targets';
import {
  countDeliverableRecipients,
  legacyEmailDeliveryRecipients,
  planCampaignDeliveries,
  type CampaignDeliveryChannel,
  type CampaignDeliveryRecipient,
} from './campaign-delivery-plan';
import {
  buildCampaignRecipientTimeline,
  type CampaignRecipientStatusCounts,
  type CampaignRecipientTimelineEntry,
} from './campaign-recipient-timeline';
import {
  buildRecipientStatusCountsForCampaign,
  isCampaignEligibleForRecipientFunnel,
} from './campaign-recipient-list-funnel';
import {
  enrichCampaignRecipientForSender,
  isFarmerCampaignRecipient,
  canResendCampaignRecipientInvite,
} from './campaign-recipient-sender-actions';
import {
  buildCampaignClaimUrl,
  defaultCampaignClaimExpiresAt,
  generateCampaignClaimToken,
  hashCampaignClaimToken,
  verifyCampaignClaimToken,
} from './campaign-claim-token';
import { sendCampaignWhatsAppInvite } from './campaign-whatsapp-delivery';
import { sendCampaignSmsInvite } from './campaign-sms-delivery';
import {
  issueCampaignDeskClaimLink as issueCampaignDeskClaimLinkHelper,
  type IssueCampaignDeskClaimLinkResult,
} from './issue-campaign-desk-claim-link';
import { recordCampaignDeliveryAttempt } from './record-campaign-delivery-attempt';
import type { CampaignInvitePublicPreview, CampaignPublicPreview } from './campaign-public-preview';

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
  target_contact_ids: string[];
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

export interface OperationalIssueRecord {
  id: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'BLOCKING';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  owner: string | null;
  linked_entity_type: string;
  linked_entity_id: string;
  linked_entity_name: string;
  due_date: string | null;
  created_at: string;
  resolution_path: string | null;
  issue_kind: 'canonical' | 'campaign' | 'request' | 'upstream_blocker';
  owner_role: string | null;
  owner_organisation_name: string | null;
  source_issue_id: string | null;
  can_update_status: boolean;
}

export interface EvidenceFeedRecord {
  id: string;
  name: string;
  type: 'community_minutes' | 'consent_form' | 'agreement' | 'affidavit';
  farmer_or_community: string;
  plot_id: string | null;
  upload_date: string;
  expiry_date: string;
  status: 'verified' | 'pending_review' | 'expired' | 'renewal_due';
  file_size_mb: number;
  sha256_hash: string;
  uploader_name: string;
  uploader_org: string;
  storage_path: string | null;
  mime_type: string | null;
  evidence_kind: string | null;
  has_file: boolean;
  metadata_only: boolean;
}

type DecisionFilter = 'all' | 'accept' | 'refuse';

const EVIDENCE_SIGNED_URL_TTL_SECONDS = 60 * 60;

@Injectable()
export class RequestsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly inboxService: InboxService,
    private readonly consentService: ConsentService,
  ) {}

  private mapDatabaseError(error: unknown): never {
    const pgError = error as { code?: string; message?: string } | null;
    const message = pgError?.message ?? '';
    if (pgError?.code === '42P01' && message.includes('request_campaigns')) {
      throw new BadRequestException(
        'Request campaign tables are not available. Apply TB-V16-025 migration first.',
      );
    }
    if (pgError?.code === '42703' && message.includes('target_contact_ids')) {
      throw new BadRequestException(
        'Request campaign contact id column is missing. Apply TB-V16-064 migration first.',
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
      target_contact_ids: row.target_contact_ids ?? [],
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
    return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://dashboard.tracebud.com';
  }

  private getDocsBaseUrl(): string {
    const raw = process.env.TRACEBUD_DOCS_PUBLIC_URL?.trim();
    return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://docs.tracebud.com';
  }

  private getDecisionSecret(): string {
    const secret =
      process.env.RESEND_DECISION_SECRET?.trim() || process.env.RESEND_API_KEY?.trim();
    if (!secret) {
      throw new BadRequestException(
        'RESEND_DECISION_SECRET is not configured. Set it on the API service, or configure RESEND_API_KEY so decision links can be signed.',
      );
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

  private getFieldAuthPublicUrl(): string {
    return (process.env.FIELD_AUTH_PUBLIC_URL ?? 'https://app.tracebud.com').replace(/\/$/, '');
  }

  private async resolveRecipientContactTypes(
    tenantId: string,
    emails: string[],
  ): Promise<Map<string, 'farmer' | 'other'>> {
    const normalized = emails.map((email) => email.trim().toLowerCase()).filter(Boolean);
    const result = new Map<string, 'farmer' | 'other'>();
    if (normalized.length === 0) {
      return result;
    }
    try {
      const res = await this.pool.query<{ email: string; contact_type: string }>(
        `
          SELECT lower(email) AS email, contact_type
          FROM crm_contacts
          WHERE tenant_id = $1
            AND lower(email) = ANY($2::text[])
        `,
        [tenantId, normalized],
      );
      for (const row of res.rows) {
        result.set(row.email, row.contact_type === 'farmer' ? 'farmer' : 'other');
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01') {
        throw error;
      }
    }
    return result;
  }

  private async loadCampaignDeliveryRecipients(
    tenantId: string,
    campaign: RequestCampaignRecord,
  ): Promise<CampaignDeliveryRecipient[]> {
    const contactIds = campaign.target_contact_ids ?? [];
    if (contactIds.length > 0) {
      try {
        const result = await this.pool.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          contact_type: string | null;
        }>(
          `
            SELECT id, full_name, email, phone, contact_type
            FROM crm_contacts
            WHERE tenant_id = $1
              AND id = ANY($2::text[])
          `,
          [tenantId, contactIds],
        );
        return planCampaignDeliveries(result.rows);
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === '42P01') {
          return legacyEmailDeliveryRecipients(campaign.target_contact_emails ?? []);
        }
        throw error;
      }
    }

    return legacyEmailDeliveryRecipients(campaign.target_contact_emails ?? []);
  }

  private async resolveDeliveryContactTypes(
    tenantId: string,
    deliveries: readonly CampaignDeliveryRecipient[],
  ): Promise<Map<string, 'farmer' | 'other'>> {
    const result = new Map<string, 'farmer' | 'other'>();
    const contactIds = deliveries
      .map((delivery) => delivery.contact_id)
      .filter((contactId) => contactId && !contactId.startsWith('legacy:'));

    if (contactIds.length > 0) {
      try {
        const res = await this.pool.query<{ id: string; contact_type: string }>(
          `
            SELECT id, contact_type
            FROM crm_contacts
            WHERE tenant_id = $1
              AND id = ANY($2::text[])
          `,
          [tenantId, contactIds],
        );
        for (const row of res.rows) {
          result.set(row.id, row.contact_type === 'farmer' ? 'farmer' : 'other');
        }
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }
    }

    const emailTypes = await this.resolveRecipientContactTypes(
      tenantId,
      deliveries
        .map((delivery) => delivery.email)
        .filter((email): email is string => Boolean(email)),
    );
    for (const [email, type] of emailTypes.entries()) {
      result.set(email, type);
    }

    return result;
  }

  private async dispatchCampaignEmails(
    campaign: RequestCampaignRecord,
    emailDeliveries: readonly CampaignDeliveryRecipient[],
  ): Promise<{
    sentCount: number;
    failedCount: number;
    failureMessages: string[];
    sentEmails: string[];
    sentDeliveries: CampaignDeliveryRecipient[];
  }> {
    const recipients = emailDeliveries
      .map((delivery) => delivery.email)
      .filter((email): email is string => Boolean(email));
    if (recipients.length === 0) {
      return {
        sentCount: 0,
        failedCount: 0,
        failureMessages: [],
        sentEmails: [],
        sentDeliveries: [],
      };
    }
    const resend = this.getResendClient();
    const requestingOrganization = await this.getRequestingOrganizationLabel(campaign);
    const senderRole = await resolveSenderPrimaryRole(this.pool, campaign.tenant_id);
    const dashboardBaseUrl = this.getDashboardBaseUrl();
    const docsBaseUrl = this.getDocsBaseUrl();
    const fieldAuthBaseUrl = this.getFieldAuthPublicUrl();
    const contactTypes = await resolveCampaignRecipientContactTypes(
      this.pool,
      campaign.tenant_id,
      emailDeliveries,
    );

    return dispatchCampaignRequestEmails({
      resend,
      fromEmail: this.getResendSender(),
      senderOrgLabel: requestingOrganization,
      senderRole,
      campaign: {
        id: campaign.id,
        tenant_id: campaign.tenant_id,
        title: campaign.title,
        description: campaign.description,
        request_type: campaign.request_type,
        due_at: campaign.due_at,
      },
      emailDeliveries,
      contactTypes,
      dashboardBaseUrl,
      docsBaseUrl,
      fieldAuthBaseUrl,
      buildUrls: ({ campaignId, recipientEmail, isFarmerRecipient }) => {
        const acceptUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaignId)}&decision=accept`;
        const refuseUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaignId)}&decision=refuse`;
        const decisionToken = this.signDecisionToken(campaignId, recipientEmail);
        const connectUrl = isFarmerRecipient
          ? `${fieldAuthBaseUrl}/campaign?campaign=${encodeURIComponent(campaignId)}`
          : `${dashboardBaseUrl}/create-account?campaign=${encodeURIComponent(campaignId)}`;
        return {
          connectUrl,
          acceptUrl: `${acceptUrl}&recipient=${encodeURIComponent(recipientEmail)}&token=${decisionToken}`,
          refuseUrl: `${refuseUrl}&recipient=${encodeURIComponent(recipientEmail)}&token=${decisionToken}`,
        };
      },
    });
  }

  async remindUnclaimedCampaignRecipientInvites(): Promise<
    import('./campaign-request-email').RemindUnclaimedCampaignInvitesResult
  > {
    try {
      const resend = this.getResendClient();
      const dashboardBaseUrl = this.getDashboardBaseUrl();
      const docsBaseUrl = this.getDocsBaseUrl();
      const fieldAuthBaseUrl = this.getFieldAuthPublicUrl();
      return remindUnclaimedCampaignRecipientInvites(this.pool, {
        resend,
        dashboardBaseUrl,
        docsBaseUrl,
        fieldAuthBaseUrl,
        resolveSenderOrgLabel: (row) =>
          this.getRequestingOrganizationLabel(row as RequestCampaignRecord),
        buildUrls: ({ campaignId, recipientEmail, isFarmerRecipient }) => {
          const acceptUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaignId)}&decision=accept`;
          const refuseUrl = `${dashboardBaseUrl}/requests/intent?campaign=${encodeURIComponent(campaignId)}&decision=refuse`;
          const decisionToken = this.signDecisionToken(campaignId, recipientEmail);
          const connectUrl = isFarmerRecipient
            ? `${fieldAuthBaseUrl}/campaign?campaign=${encodeURIComponent(campaignId)}`
            : `${dashboardBaseUrl}/create-account?campaign=${encodeURIComponent(campaignId)}`;
          return {
            connectUrl,
            acceptUrl: `${acceptUrl}&recipient=${encodeURIComponent(recipientEmail)}&token=${decisionToken}`,
            refuseUrl: `${refuseUrl}&recipient=${encodeURIComponent(recipientEmail)}&token=${decisionToken}`,
          };
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { scanned: 0, sent: 0, skipped: 0, failures: [] };
      }
      throw error;
    }
  }

  private async dispatchCampaignWhatsApp(
    campaign: RequestCampaignRecord,
    whatsappDeliveries: readonly CampaignDeliveryRecipient[],
  ): Promise<{
    sentCount: number;
    skippedCount: number;
    inviteDeliveries: Array<{
      contact_id: string;
      delivery_channel: 'whatsapp' | 'sms';
      delivery_address: string | null;
      recipient_email: string | null;
      claim_token_hash: string;
      claim_expires_at: string;
      claim_token: string;
    }>;
  }> {
    if (whatsappDeliveries.length === 0) {
      return { sentCount: 0, skippedCount: 0, inviteDeliveries: [] };
    }

    const fromOrg = await this.getRequestingOrganizationLabel(campaign);
    const fieldAuthBaseUrl = this.getFieldAuthPublicUrl();
    const inviteDeliveries: Array<{
      contact_id: string;
      delivery_channel: 'whatsapp' | 'sms';
      delivery_address: string | null;
      recipient_email: string | null;
      claim_token_hash: string;
      claim_expires_at: string;
      claim_token: string;
    }> = [];
    let sentCount = 0;
    let skippedCount = 0;

    for (const delivery of whatsappDeliveries) {
      const phone = delivery.delivery_address ?? delivery.phone;
      if (!phone) {
        skippedCount += 1;
        continue;
      }
      const { token, tokenHash } = generateCampaignClaimToken();
      const claimExpiresAt = defaultCampaignClaimExpiresAt();
      const claimUrl = buildCampaignClaimUrl(fieldAuthBaseUrl, campaign.id, token);
      const result = await sendCampaignWhatsAppInvite({
        toPhoneE164: phone,
        campaignTitle: campaign.title,
        fromOrg,
        claimUrl,
      });
      let deliveryChannel: 'whatsapp' | 'sms' = 'whatsapp';
      if (result.sent) {
        sentCount += 1;
        await recordCampaignDeliveryAttempt(this.pool, {
          campaignId: campaign.id,
          senderTenantId: campaign.tenant_id,
          contactId: delivery.contact_id,
          deliveryChannel: 'whatsapp',
          deliveryAddress: phone,
          status: 'sent',
          provider: 'whatsapp',
          providerMessageId: result.messageId,
          claimTokenHash: tokenHash,
        });
      } else {
        const smsResult = await sendCampaignSmsInvite({
          toPhoneE164: phone,
          campaignTitle: campaign.title,
          fromOrg,
          claimUrl,
          recipientContactType: delivery.contact_type,
        });
        if (smsResult.sent) {
          deliveryChannel = 'sms';
          sentCount += 1;
          await recordCampaignDeliveryAttempt(this.pool, {
            campaignId: campaign.id,
            senderTenantId: campaign.tenant_id,
            contactId: delivery.contact_id,
            deliveryChannel: 'whatsapp',
            deliveryAddress: phone,
            status: 'skipped',
            provider: 'whatsapp',
            skipReason: result.skippedReason,
            claimTokenHash: tokenHash,
          });
          await recordCampaignDeliveryAttempt(this.pool, {
            campaignId: campaign.id,
            senderTenantId: campaign.tenant_id,
            contactId: delivery.contact_id,
            deliveryChannel: 'sms',
            deliveryAddress: phone,
            status: 'sent',
            provider: 'twilio',
            providerMessageId: smsResult.messageId,
            claimTokenHash: tokenHash,
          });
        } else {
          skippedCount += 1;
          await recordCampaignDeliveryAttempt(this.pool, {
            campaignId: campaign.id,
            senderTenantId: campaign.tenant_id,
            contactId: delivery.contact_id,
            deliveryChannel: 'whatsapp',
            deliveryAddress: phone,
            status: 'failed',
            provider: 'whatsapp',
            skipReason: result.skippedReason,
            claimTokenHash: tokenHash,
          });
          await recordCampaignDeliveryAttempt(this.pool, {
            campaignId: campaign.id,
            senderTenantId: campaign.tenant_id,
            contactId: delivery.contact_id,
            deliveryChannel: 'sms',
            deliveryAddress: phone,
            status: 'skipped',
            provider: 'twilio',
            skipReason: smsResult.skippedReason,
            claimTokenHash: tokenHash,
          });
        }
      }
      inviteDeliveries.push({
        contact_id: delivery.contact_id,
        delivery_channel: deliveryChannel,
        delivery_address: phone,
        recipient_email: null,
        claim_token_hash: tokenHash,
        claim_expires_at: claimExpiresAt,
        claim_token: token,
      });
    }

    return { sentCount, skippedCount, inviteDeliveries };
  }

  private async dispatchCampaignDesk(
    campaign: RequestCampaignRecord,
    deskDeliveries: readonly CampaignDeliveryRecipient[],
  ): Promise<{
    inviteDeliveries: Array<{
      contact_id: string;
      delivery_channel: 'desk_only';
      delivery_address: string | null;
      recipient_email: string | null;
      claim_token_hash: string;
      claim_expires_at: string;
    }>;
  }> {
    if (deskDeliveries.length === 0) {
      return { inviteDeliveries: [] };
    }

    const inviteDeliveries: Array<{
      contact_id: string;
      delivery_channel: 'desk_only';
      delivery_address: string | null;
      recipient_email: string | null;
      claim_token_hash: string;
      claim_expires_at: string;
    }> = [];

    for (const delivery of deskDeliveries) {
      const { tokenHash } = generateCampaignClaimToken();
      const claimExpiresAt = defaultCampaignClaimExpiresAt();
      inviteDeliveries.push({
        contact_id: delivery.contact_id,
        delivery_channel: 'desk_only',
        delivery_address: delivery.delivery_address ?? delivery.phone ?? delivery.full_name,
        recipient_email: delivery.email,
        claim_token_hash: tokenHash,
        claim_expires_at: claimExpiresAt,
      });
      await recordCampaignDeliveryAttempt(this.pool, {
        campaignId: campaign.id,
        senderTenantId: campaign.tenant_id,
        contactId: delivery.contact_id,
        deliveryChannel: 'desk_only',
        deliveryAddress: delivery.delivery_address ?? delivery.phone ?? delivery.full_name,
        status: 'queued',
        provider: 'desk_qr',
        claimTokenHash: tokenHash,
      });
    }

    return { inviteDeliveries };
  }

  async issueCampaignDeskClaimLink(
    tenantId: string,
    campaignId: string,
    contactId: string,
  ): Promise<IssueCampaignDeskClaimLinkResult> {
    try {
      return await issueCampaignDeskClaimLinkHelper(this.pool, {
        tenantId,
        campaignId,
        contactId,
        fieldAuthBaseUrl: this.getFieldAuthPublicUrl(),
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  private async syncTargetsToContacts(
    tenantId: string,
    targets: Array<CampaignTargetInput>,
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
      if (target.contact_id?.trim()) {
        continue;
      }
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

  async list(
    tenantId: string,
  ): Promise<Array<RequestCampaignRecord & { recipient_status_counts?: CampaignRecipientStatusCounts }>> {
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
      const campaigns = result.rows.map((row) => this.mapRow(row));
      return await this.enrichCampaignsWithRecipientFunnel(tenantId, campaigns);
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  private async enrichCampaignsWithRecipientFunnel(
    tenantId: string,
    campaigns: RequestCampaignRecord[],
  ): Promise<Array<RequestCampaignRecord & { recipient_status_counts?: CampaignRecipientStatusCounts }>> {
    const eligible = campaigns.filter((campaign) =>
      isCampaignEligibleForRecipientFunnel(campaign.status),
    );
    if (eligible.length === 0) {
      return campaigns;
    }

    const campaignIds = eligible.map((campaign) => campaign.id);
    const contactIds = Array.from(
      new Set(
        eligible.flatMap((campaign) => campaign.target_contact_ids ?? []).filter((id) => id.length > 0),
      ),
    );

    const contactsById = new Map<
      string,
      { contact_id: string; full_name: string; email: string | null; phone: string | null }
    >();
    if (contactIds.length > 0) {
      try {
        const contactsResult = await this.pool.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
        }>(
          `
            SELECT id, full_name, email, phone
            FROM crm_contacts
            WHERE tenant_id = $1
              AND id = ANY($2::text[])
          `,
          [tenantId, contactIds],
        );
        for (const row of contactsResult.rows) {
          contactsById.set(row.id, {
            contact_id: row.id,
            full_name: row.full_name,
            email: row.email,
            phone: row.phone,
          });
        }
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }
    }

    const invitesByCampaign = new Map<
      string,
      Array<{
        contact_id: string | null;
        recipient_email: string | null;
        delivery_channel: string | null;
        status: string;
        claimed_tenant_id: string | null;
        claimed_farmer_profile_id: string | null;
        sent_at: string | null;
      }>
    >();
    try {
      const inviteResult = await this.pool.query<{
        campaign_id: string;
        contact_id: string | null;
        recipient_email: string | null;
        delivery_channel: string | null;
        status: string;
        claimed_tenant_id: string | null;
        claimed_farmer_profile_id: string | null;
        sent_at: string | null;
      }>(
        `
          SELECT
            campaign_id,
            contact_id,
            LOWER(recipient_email) AS recipient_email,
            delivery_channel,
            status,
            claimed_tenant_id,
            claimed_farmer_profile_id,
            sent_at
          FROM campaign_recipient_invites
          WHERE sender_tenant_id = $1
            AND campaign_id = ANY($2::text[])
        `,
        [tenantId, campaignIds],
      );
      for (const row of inviteResult.rows) {
        const bucket = invitesByCampaign.get(row.campaign_id) ?? [];
        bucket.push(row);
        invitesByCampaign.set(row.campaign_id, bucket);
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01' && code !== '42703') {
        throw error;
      }
    }

    const decisionsByCampaign = new Map<
      string,
      Array<{
        recipient_email: string;
        decision: 'accept' | 'refuse';
        source: string;
        fulfillment_source: string | null;
        contact_id: string | null;
        decided_at: string;
      }>
    >();
    const decisionsResult = await this.pool.query<{
      campaign_id: string;
      recipient_email: string;
      decision: 'accept' | 'refuse';
      source: string;
      fulfillment_source: string | null;
      contact_id: string | null;
      decided_at: string;
    }>(
      `
        SELECT
          decision.campaign_id,
          decision.recipient_email,
          decision.decision,
          decision.source,
          decision.fulfillment_source,
          decision.contact_id,
          decision.decided_at
        FROM request_campaign_recipient_decisions decision
        INNER JOIN request_campaigns campaign
          ON campaign.id = decision.campaign_id
        WHERE campaign.tenant_id = $1
          AND decision.campaign_id = ANY($2::text[])
      `,
      [tenantId, campaignIds],
    );
    for (const row of decisionsResult.rows) {
      const bucket = decisionsByCampaign.get(row.campaign_id) ?? [];
      bucket.push({
        recipient_email: row.recipient_email,
        decision: row.decision,
        source: row.source,
        fulfillment_source: row.fulfillment_source,
        contact_id: row.contact_id,
        decided_at: new Date(row.decided_at).toISOString(),
      });
      decisionsByCampaign.set(row.campaign_id, bucket);
    }

    const funnelByCampaignId = new Map<string, CampaignRecipientStatusCounts>();
    for (const campaign of eligible) {
      const targetContacts = (campaign.target_contact_ids ?? [])
        .map((contactId) => contactsById.get(contactId))
        .filter((contact): contact is NonNullable<typeof contact> => Boolean(contact));
      funnelByCampaignId.set(
        campaign.id,
        buildRecipientStatusCountsForCampaign({
          campaign,
          targetContacts,
          invites: invitesByCampaign.get(campaign.id) ?? [],
          decisions: decisionsByCampaign.get(campaign.id) ?? [],
        }),
      );
    }

    return campaigns.map((campaign) => {
      const recipient_status_counts = funnelByCampaignId.get(campaign.id);
      return recipient_status_counts ? { ...campaign, recipient_status_counts } : campaign;
    });
  }

  /**
   * Non-sensitive campaign summary for field-app / marketing smart links.
   * Does not expose recipient emails or internal tenant metadata beyond org label.
   */
  async getCampaignPublicPreview(campaignId: string): Promise<CampaignPublicPreview> {
    const normalizedId = campaignId?.trim();
    if (!normalizedId) {
      throw new NotFoundException('Campaign not found');
    }
    try {
      const result = await this.pool.query<RequestCampaignRecord>(
        `
          SELECT *
          FROM request_campaigns
          WHERE id = $1
            AND status NOT IN ('DRAFT', 'QUEUED', 'CANCELLED')
          LIMIT 1
        `,
        [normalizedId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException('Campaign not found');
      }
      const campaign = this.mapRow(row);
      const fromOrg = await this.getRequestingOrganizationLabel(campaign);
      return {
        campaignId: campaign.id,
        title: campaign.title?.trim() || 'Farm data request',
        fromOrg,
        dueAt: campaign.due_at ?? null,
        senderTenantId: campaign.tenant_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async getCampaignInvitePublicPreview(
    campaignId: string,
    token: string,
  ): Promise<CampaignInvitePublicPreview> {
    const normalizedId = campaignId?.trim();
    const normalizedToken = token?.trim();
    if (!normalizedId || !normalizedToken) {
      throw new NotFoundException('Campaign invite not found');
    }

    const tokenHash = hashCampaignClaimToken(normalizedToken);
    try {
      const inviteResult = await this.pool.query<{
        campaign_id: string;
        delivery_channel: string;
        delivery_address: string | null;
        claim_token_hash: string | null;
        claim_expires_at: string | null;
      }>(
        `
          SELECT
            campaign_id,
            delivery_channel,
            delivery_address,
            claim_token_hash,
            claim_expires_at
          FROM campaign_recipient_invites
          WHERE campaign_id = $1
            AND claim_token_hash = $2
          LIMIT 1
        `,
        [normalizedId, tokenHash],
      );
      const invite = inviteResult.rows[0];
      if (!invite?.claim_token_hash || !verifyCampaignClaimToken(normalizedToken, invite.claim_token_hash)) {
        throw new NotFoundException('Campaign invite not found');
      }
      if (invite.claim_expires_at && new Date(invite.claim_expires_at).getTime() < Date.now()) {
        throw new NotFoundException('Campaign invite has expired');
      }

      const preview = await this.getCampaignPublicPreview(normalizedId);
      return {
        ...preview,
        deliveryChannel:
          invite.delivery_channel === 'whatsapp' ||
          invite.delivery_channel === 'desk_only' ||
          invite.delivery_channel === 'email'
            ? invite.delivery_channel
            : 'whatsapp',
        recipientLabel: invite.delivery_address?.trim() || 'Recipient',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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
    recipients: CampaignRecipientTimelineEntry[];
    recipient_status_counts: CampaignRecipientStatusCounts;
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
      const campaignResult = await this.pool.query<{
        id: string;
        tenant_id: string;
        status: RequestCampaignRecord['status'];
        target_contact_emails: string[] | null;
        target_contact_ids: string[] | null;
        require_farmer_app_confirmation: boolean;
      }>(
        `
          SELECT id, tenant_id, status, target_contact_emails, target_contact_ids, require_farmer_app_confirmation
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
      const targetContactEmails = campaignResult.rows[0].target_contact_emails ?? [];
      const targetContactIds = campaignResult.rows[0].target_contact_ids ?? [];
      const requireFarmerAppConfirmation =
        campaignResult.rows[0].require_farmer_app_confirmation ?? false;
      let targetContacts: Array<{
        contact_id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
      }> = [];
      if (targetContactIds.length > 0) {
        try {
          const contactsResult = await this.pool.query<{
            id: string;
            full_name: string;
            email: string | null;
            phone: string | null;
          }>(
            `
              SELECT id, full_name, email, phone
              FROM crm_contacts
              WHERE tenant_id = $1
                AND id = ANY($2::text[])
            `,
            [tenantId, targetContactIds],
          );
          targetContacts = contactsResult.rows.map((row) => ({
            contact_id: row.id,
            full_name: row.full_name,
            email: row.email,
            phone: row.phone,
          }));
        } catch (error) {
          const code = (error as { code?: string } | null)?.code;
          if (code !== '42P01') {
            throw error;
          }
        }
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

      const timelineDecisionsResult = await this.pool.query<RequestCampaignDecisionRecord & {
        fulfillment_source: string | null;
        contact_id: string | null;
      }>(
        `
          SELECT
            decision.recipient_email,
            decision.decision,
            decision.decided_at,
            decision.source,
            decision.fulfillment_source,
            decision.contact_id
          FROM request_campaign_recipient_decisions decision
          INNER JOIN request_campaigns campaign
            ON campaign.id = decision.campaign_id
          WHERE campaign.tenant_id = $1
            AND decision.campaign_id = $2
        `,
        [tenantId, campaignId],
      );

      let inviteRows: Array<{
        contact_id: string | null;
        recipient_email: string | null;
        delivery_channel: string | null;
        status: string;
        claimed_tenant_id: string | null;
        claimed_farmer_profile_id: string | null;
        sent_at: string | null;
      }> = [];
      try {
        const inviteResult = await this.pool.query<{
          contact_id: string | null;
          recipient_email: string | null;
          delivery_channel: string | null;
          status: string;
          claimed_tenant_id: string | null;
          claimed_farmer_profile_id: string | null;
          sent_at: string | null;
        }>(
          `
            SELECT
              contact_id,
              LOWER(recipient_email) AS recipient_email,
              delivery_channel,
              status,
              claimed_tenant_id,
              claimed_farmer_profile_id,
              sent_at
            FROM campaign_recipient_invites
            WHERE campaign_id = $1
              AND sender_tenant_id = $2
          `,
          [campaignId, tenantId],
        );
        inviteRows = inviteResult.rows;
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === '42P01' || code === '42703') {
          try {
            const legacyInviteResult = await this.pool.query<{
              recipient_email: string;
              status: string;
              claimed_tenant_id: string | null;
              claimed_farmer_profile_id: string | null;
              sent_at: string | null;
            }>(
              `
                SELECT
                  LOWER(recipient_email) AS recipient_email,
                  status,
                  claimed_tenant_id,
                  claimed_farmer_profile_id,
                  sent_at
                FROM campaign_recipient_invites
                WHERE campaign_id = $1
                  AND sender_tenant_id = $2
              `,
              [campaignId, tenantId],
            );
            inviteRows = legacyInviteResult.rows.map((row) => ({
              contact_id: null,
              recipient_email: row.recipient_email,
              delivery_channel: 'email',
              status: row.status,
              claimed_tenant_id: row.claimed_tenant_id,
              claimed_farmer_profile_id: row.claimed_farmer_profile_id,
              sent_at: row.sent_at,
            }));
          } catch (legacyError) {
            const legacyCode = (legacyError as { code?: string } | null)?.code;
            if (legacyCode !== '42P01') {
              throw legacyError;
            }
          }
        } else {
          throw error;
        }
      }

      const timeline = buildCampaignRecipientTimeline({
        targetEmails: targetContacts.length > 0 ? undefined : targetContactEmails,
        targetContacts: targetContacts.length > 0 ? targetContacts : undefined,
        invites: inviteRows,
        decisions: timelineDecisionsResult.rows.map((row) => ({
          recipient_email: row.recipient_email,
          decision: row.decision,
          source: row.source,
          fulfillment_source: row.fulfillment_source,
          contact_id: row.contact_id,
          decided_at: new Date(row.decided_at).toISOString(),
        })),
        requireFarmerAppConfirmation: requireFarmerAppConfirmation,
      });

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

      const deliveryRecipients: CampaignDeliveryRecipient[] = timeline.recipients.map((recipient) => {
        const channel: CampaignDeliveryChannel =
          recipient.delivery_channel === 'whatsapp' ||
          recipient.delivery_channel === 'desk_only' ||
          recipient.delivery_channel === 'email'
            ? recipient.delivery_channel
            : 'email';
        return {
          contact_id: recipient.contact_id ?? `legacy:${recipient.recipient_email ?? 'unknown'}`,
          full_name: recipient.recipient_label,
          email: recipient.recipient_email,
          phone: null,
          delivery_channel: channel,
          delivery_address: recipient.recipient_email,
        };
      });
      const contactTypes = await this.resolveDeliveryContactTypes(tenantId, deliveryRecipients);
      const dashboardBaseUrl = this.getDashboardBaseUrl();
      const fieldAuthBaseUrl = this.getFieldAuthPublicUrl();
      const campaignStatus = campaignResult.rows[0].status;
      const enrichedRecipients = timeline.recipients.map((recipient) =>
        enrichCampaignRecipientForSender(recipient, {
          campaignId,
          campaignStatus,
          dashboardBaseUrl,
          fieldAuthBaseUrl,
          isFarmerRecipient: isFarmerCampaignRecipient(recipient, contactTypes),
        }),
      );

      return {
        campaign_id: campaignId,
        tenant_id: tenantId,
        last_synced_at: decisions[0]?.decided_at ?? null,
        decisions,
        counts,
        recipients: enrichedRecipients,
        recipient_status_counts: timeline.status_counts,
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

  async resendCampaignRecipientInvite(
    tenantId: string,
    campaignId: string,
    recipientEmail: string,
    actorUserId?: string | null,
  ): Promise<{ ok: true; recipient_email: string }> {
    const normalizedEmail = recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('recipient_email must be a valid email address.');
    }

    try {
      const campaignResult = await this.pool.query<RequestCampaignRecord>(
        `
          SELECT *
          FROM request_campaigns
          WHERE tenant_id = $1
            AND id = $2
          LIMIT 1
        `,
        [tenantId, campaignId],
      );
      const campaignRow = campaignResult.rows[0];
      if (!campaignRow) {
        throw new BadRequestException('Campaign not found.');
      }
      const campaign = this.mapRow(campaignRow);

      const decisionsResult = await this.pool.query<{
        recipient_email: string;
        decision: 'accept' | 'refuse';
        source: string;
        fulfillment_source: string | null;
        contact_id: string | null;
        decided_at: string;
      }>(
        `
          SELECT recipient_email, decision, source, fulfillment_source, contact_id, decided_at
          FROM request_campaign_recipient_decisions
          WHERE campaign_id = $1
            AND LOWER(recipient_email) = $2
          LIMIT 1
        `,
        [campaignId, normalizedEmail],
      );

      let inviteRow: {
        contact_id: string | null;
        recipient_email: string | null;
        delivery_channel: string | null;
        status: string;
        claimed_tenant_id: string | null;
        claimed_farmer_profile_id: string | null;
        sent_at: string | null;
      } | null = null;
      try {
        const inviteResult = await this.pool.query<{
          contact_id: string | null;
          recipient_email: string | null;
          delivery_channel: string | null;
          status: string;
          claimed_tenant_id: string | null;
          claimed_farmer_profile_id: string | null;
          sent_at: string | null;
        }>(
          `
            SELECT
              contact_id,
              LOWER(recipient_email) AS recipient_email,
              delivery_channel,
              status,
              claimed_tenant_id,
              claimed_farmer_profile_id,
              sent_at
            FROM campaign_recipient_invites
            WHERE campaign_id = $1
              AND sender_tenant_id = $2
              AND LOWER(recipient_email) = $3
            LIMIT 1
          `,
          [campaignId, tenantId, normalizedEmail],
        );
        inviteRow = inviteResult.rows[0] ?? null;
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01' && code !== '42703') {
          throw error;
        }
      }

      const timeline = buildCampaignRecipientTimeline({
        targetEmails: [normalizedEmail],
        invites: inviteRow ? [inviteRow] : [],
        decisions: decisionsResult.rows.map((row) => ({
          recipient_email: row.recipient_email,
          decision: row.decision,
          source: row.source,
          fulfillment_source: row.fulfillment_source,
          contact_id: row.contact_id,
          decided_at: new Date(row.decided_at).toISOString(),
        })),
      });
      const recipient = timeline.recipients[0];
      if (!recipient) {
        throw new BadRequestException('Recipient not found on this campaign.');
      }

      if (
        !canResendCampaignRecipientInvite({
          onboardingStatus: recipient.onboarding_status,
          campaignStatus: campaign.status,
          recipientEmail: recipient.recipient_email,
          deliveryChannel: recipient.delivery_channel,
        })
      ) {
        throw new BadRequestException('This recipient is not eligible for invite resend.');
      }

      const plannedDeliveries = await this.loadCampaignDeliveryRecipients(tenantId, campaign);
      const delivery =
        plannedDeliveries.find(
          (entry) => entry.email?.trim().toLowerCase() === normalizedEmail,
        ) ??
        plannedDeliveries.find(
          (entry) =>
            inviteRow?.contact_id &&
            entry.contact_id === inviteRow.contact_id,
        );
      if (!delivery) {
        throw new BadRequestException('Recipient delivery channel could not be resolved.');
      }

      if (delivery.delivery_channel === 'email') {
        const emailDelivery = await this.dispatchCampaignEmails(campaign, [delivery]);
        if (emailDelivery.sentCount === 0) {
          const reason = emailDelivery.failureMessages[0];
          throw new BadRequestException(
            reason ? `Invite resend failed. ${reason}` : 'Invite resend failed.',
          );
        }
      } else if (delivery.delivery_channel === 'whatsapp') {
        const whatsappDelivery = await this.dispatchCampaignWhatsApp(campaign, [delivery]);
        if (whatsappDelivery.sentCount === 0) {
          throw new BadRequestException('WhatsApp invite resend failed.');
        }
      } else {
        throw new BadRequestException('Desk-only recipients cannot receive automated resends.');
      }

      try {
        await this.pool.query(
          `
            UPDATE campaign_recipient_invites
            SET sent_at = NOW()
            WHERE campaign_id = $1
              AND sender_tenant_id = $2
              AND LOWER(recipient_email) = $3
          `,
          [campaignId, tenantId, normalizedEmail],
        );
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }

      await this.emitCampaignAudit('campaign_recipient_invite_resent', {
        campaign_id: campaignId,
        tenant_id: tenantId,
        recipient_email: normalizedEmail,
        actor_user_id: actorUserId ?? null,
        delivery_channel: delivery.delivery_channel,
      });

      return { ok: true, recipient_email: normalizedEmail };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  private async emitCampaignAudit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
        eventType,
        JSON.stringify(payload),
      ]);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return;
      }
      throw error;
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
      targets?: Array<CampaignTargetInput>;
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
    const { target_contact_ids: targetContactIds, target_contact_emails: targetContactEmails } =
      resolveCampaignTargetFields(targets);

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
            target_contact_ids,
            due_at,
            reminder_sent_at,
            accepted_count,
            pending_count,
            expired_count,
            created_by,
            idempotency_key
          )
          VALUES (
            $1, $2, $3, $4, $5, 'DRAFT', $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::timestamptz, NULL, 0, 0, 0, $12, $13
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
          targetContactIds,
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
      targets?: Array<CampaignTargetInput>;
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
    const { target_contact_ids: targetContactIds, target_contact_emails: targetContactEmails } =
      resolveCampaignTargetFields(targets);

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
            target_contact_ids = $8::text[],
            due_at = $9::timestamptz,
            updated_at = NOW()
          WHERE tenant_id = $10
            AND id = $11
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
          targetContactIds,
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
    actorUserId?: string | null,
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
      const currentRow = currentResult.rows[0];
      if (!currentRow) {
        throw new BadRequestException('Draft campaign not found or already sent.');
      }
      const current = this.mapRow(currentRow);
      const plannedDeliveries = await this.loadCampaignDeliveryRecipients(tenantId, current);
      const deliverable = countDeliverableRecipients(plannedDeliveries);
      if (deliverable.total === 0) {
        throw new BadRequestException(
          'This campaign has no deliverable recipients. Edit the draft and add contacts with email or phone before sending.',
        );
      }
      const emailDeliveries = plannedDeliveries.filter(
        (delivery) => delivery.delivery_channel === 'email',
      );
      const whatsappDeliveries = plannedDeliveries.filter(
        (delivery) => delivery.delivery_channel === 'whatsapp',
      );
      const deskDeliveries = plannedDeliveries.filter(
        (delivery) => delivery.delivery_channel === 'desk_only',
      );
      const delivery = await this.dispatchCampaignEmails(current, emailDeliveries);
      const whatsappDelivery = await this.dispatchCampaignWhatsApp(current, whatsappDeliveries);
      const deskDelivery = await this.dispatchCampaignDesk(current, deskDeliveries);
      if (
        delivery.sentCount === 0 &&
        whatsappDelivery.sentCount === 0 &&
        deskDeliveries.length === 0
      ) {
        const reason = delivery.failureMessages[0];
        throw new BadRequestException(
          reason
            ? `No campaign outreach was delivered. ${reason}`
            : 'No campaign outreach was delivered. Check recipient addresses and Resend setup.',
        );
      }
      const nextPendingCount =
        delivery.sentCount + whatsappDelivery.inviteDeliveries.length + deskDeliveries.length;
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
      const fromOrg = await this.getRequestingOrganizationLabel(campaign);
      try {
        await this.inboxService.fanOutFromCampaignSend({ campaign, fromOrg });
      } catch (fanoutError) {
        try {
          await this.pool.query(
            `
              INSERT INTO audit_log (event_type, payload)
              VALUES ($1, $2::jsonb)
            `,
            [
              'inbox_requests_campaign_fanout_failed',
              JSON.stringify({
                campaignId: campaign.id,
                senderTenantId: tenantId,
                message:
                  fanoutError instanceof Error ? fanoutError.message : 'Inbox fan-out failed after campaign send.',
              }),
            ],
          );
        } catch {
          // Campaign send already succeeded; do not fail the API response.
        }
      }
      try {
        const inviteDeliveries = [
          ...delivery.sentDeliveries.map((row) => ({
            contact_id: row.contact_id,
            delivery_channel: 'email' as const,
            delivery_address: row.email,
            recipient_email: row.email,
          })),
          ...whatsappDelivery.inviteDeliveries.map((row) => ({
            contact_id: row.contact_id,
            delivery_channel: 'whatsapp' as const,
            delivery_address: row.delivery_address,
            recipient_email: row.recipient_email,
            claim_token_hash: row.claim_token_hash,
            claim_expires_at: row.claim_expires_at,
          })),
          ...deskDelivery.inviteDeliveries.map((row) => ({
            contact_id: row.contact_id,
            delivery_channel: 'desk_only' as const,
            delivery_address: row.delivery_address,
            recipient_email: row.recipient_email,
            claim_token_hash: row.claim_token_hash,
            claim_expires_at: row.claim_expires_at,
          })),
        ];
        await queueCampaignRecipientInvites(this.pool, {
          campaignId: campaign.id,
          senderTenantId: tenantId,
          deliveries: inviteDeliveries,
          actorUserId: actorUserId ?? null,
        });
      } catch (inviteError) {
        try {
          await this.pool.query(
            `
              INSERT INTO audit_log (event_type, payload)
              VALUES ($1, $2::jsonb)
            `,
            [
              'campaign_recipient_invites_queue_failed',
              JSON.stringify({
                campaignId: campaign.id,
                senderTenantId: tenantId,
                message:
                  inviteError instanceof Error
                    ? inviteError.message
                    : 'Campaign recipient invite queue failed after campaign send.',
              }),
            ],
          );
        } catch {
          // Campaign send already succeeded; do not fail the API response.
        }
      }
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
    const campaign = this.mapRow(updated.rows[0]);

    if (input.decision === 'accept') {
      try {
        await this.inboxService.ensureInboxFromEmailCtaAccept({
          campaignId: input.campaignId,
          recipientEmail,
        });
      } catch (inboxError) {
        try {
          await this.pool.query(
            `
              INSERT INTO audit_log (event_type, payload)
              VALUES ($1, $2::jsonb)
            `,
            [
              'inbox_requests_email_cta_inbox_failed',
              JSON.stringify({
                campaignId: input.campaignId,
                recipientEmail,
                message:
                  inboxError instanceof Error
                    ? inboxError.message
                    : 'Inbox ensure failed after email CTA accept.',
              }),
            ],
          );
        } catch {
          // Decision was recorded; do not fail the public CTA response.
        }
      }
    }

    return {
      campaign_id: input.campaignId,
      decision: input.decision,
      recorded: true,
      campaign,
    };
  }

  async listOperationalIssues(tenantId: string): Promise<OperationalIssueRecord[]> {
    try {
      const [owned, upstream] = await Promise.all([
        this.listOwnedOperationalIssues(tenantId),
        this.listUpstreamBlockerIssues(tenantId),
      ]);
      return [...owned, ...upstream]
        .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
        .slice(0, 100);
    } catch (error) {
      const pgError = error as { code?: string; message?: string } | null;
      if (pgError?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  private normalizeOperationalIssue(
    row: OperationalIssueRecord & { due_date?: string | null; created_at: string; can_update_status?: boolean },
  ): OperationalIssueRecord {
    return {
      ...row,
      due_date: row.due_date ? new Date(row.due_date).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      can_update_status: Boolean(row.can_update_status),
    };
  }

  private async listOwnedOperationalIssues(tenantId: string): Promise<OperationalIssueRecord[]> {
    const result = await this.pool.query<OperationalIssueRecord>(
      `
        SELECT
          CONCAT('issue_campaign_', rc.id) AS id,
          rc.title AS title,
          COALESCE(NULLIF(rc.description, ''), 'Campaign requires remediation follow-up.') AS description,
          CASE
            WHEN rc.status = 'EXPIRED' THEN 'BLOCKING'
            WHEN rc.status IN ('RUNNING', 'PARTIAL') AND rc.due_at <= NOW() + INTERVAL '2 days' THEN 'WARNING'
            ELSE 'INFO'
          END AS severity,
          CASE
            WHEN rc.status = 'EXPIRED' THEN 'open'
            WHEN rc.status IN ('RUNNING', 'PARTIAL') THEN 'in_progress'
            WHEN rc.status = 'COMPLETED' THEN 'resolved'
            WHEN rc.status = 'CANCELLED' THEN 'closed'
            ELSE 'open'
          END AS status,
          NULL::text AS owner,
          'campaign'::text AS linked_entity_type,
          rc.id AS linked_entity_id,
          rc.title AS linked_entity_name,
          rc.due_at::text AS due_date,
          rc.created_at::text AS created_at,
          CASE
            WHEN rc.status = 'EXPIRED' THEN 'Escalate overdue campaign and collect missing evidence from supplier.'
            WHEN rc.status IN ('RUNNING', 'PARTIAL') THEN 'Track recipients, send reminders, and close missing evidence gaps.'
            ELSE 'Review completion and archive if no further remediation is needed.'
          END AS resolution_path,
          'campaign'::text AS issue_kind,
          COALESCE(tcp.primary_role, 'exporter')::text AS owner_role,
          tcp.organization_name AS owner_organisation_name,
          NULL::text AS source_issue_id,
          false AS can_update_status
        FROM request_campaigns rc
        LEFT JOIN tenant_commercial_profiles tcp ON tcp.tenant_id = rc.tenant_id::text
        WHERE rc.tenant_id::text = $1::text
        UNION ALL
        SELECT
          CONCAT('issue_request_', ir.id) AS id,
          ir.title AS title,
          'Inbound request is pending response from recipient organization.' AS description,
          CASE
            WHEN ir.due_at < NOW() THEN 'BLOCKING'
            WHEN ir.due_at <= NOW() + INTERVAL '2 days' THEN 'WARNING'
            ELSE 'INFO'
          END AS severity,
          CASE
            WHEN ir.status = 'RESPONDED' THEN 'resolved'
            WHEN ir.due_at < NOW() THEN 'open'
            ELSE 'in_progress'
          END AS status,
          NULL::text AS owner,
          'request'::text AS linked_entity_type,
          ir.id AS linked_entity_id,
          ir.title AS linked_entity_name,
          ir.due_at::text AS due_date,
          ir.created_at::text AS created_at,
          'Respond to request and attach required shipment or evidence artifacts.' AS resolution_path,
          'request'::text AS issue_kind,
          COALESCE(recipient_tcp.primary_role, 'importer')::text AS owner_role,
          recipient_tcp.organization_name AS owner_organisation_name,
          NULL::text AS source_issue_id,
          false AS can_update_status
        FROM inbox_requests ir
        LEFT JOIN tenant_commercial_profiles recipient_tcp
          ON recipient_tcp.tenant_id = ir.recipient_tenant_id
        WHERE ir.recipient_tenant_id = $1::text
        UNION ALL
        SELECT
          CONCAT('issue_compliance_', ci.id::text) AS id,
          ci.title AS title,
          ci.description AS description,
          ci.severity AS severity,
          ci.status AS status,
          NULL::text AS owner,
          ci.linked_entity_type::text AS linked_entity_type,
          ci.linked_entity_id AS linked_entity_id,
          COALESCE(NULLIF(ci.title, ''), ci.linked_entity_id) AS linked_entity_name,
          ci.due_at::text AS due_date,
          ci.created_at::text AS created_at,
          COALESCE(
            ci.resolution_path,
            'Review the linked entity and update issue status when remediation is complete.'
          ) AS resolution_path,
          'canonical'::text AS issue_kind,
          COALESCE(ci.owner_role, 'exporter')::text AS owner_role,
          owner_tcp.organization_name AS owner_organisation_name,
          NULL::text AS source_issue_id,
          true AS can_update_status
        FROM compliance_issues ci
        LEFT JOIN tenant_commercial_profiles owner_tcp ON owner_tcp.tenant_id = ci.tenant_id::text
        WHERE ci.tenant_id::text = $1::text
          AND ci.status <> 'closed'
      `,
      [tenantId],
    );
    return result.rows.map((row) => this.normalizeOperationalIssue(row));
  }

  private async listUpstreamBlockerIssues(tenantId: string): Promise<OperationalIssueRecord[]> {
    try {
      const result = await this.pool.query<OperationalIssueRecord>(
        `
          SELECT
            CONCAT('issue_upstream_', ci.id::text) AS id,
            ci.title AS title,
            CONCAT(
              'Upstream organisation must resolve this before your shared shipments can clear. ',
              ci.description
            ) AS description,
            ci.severity AS severity,
            ci.status AS status,
            NULL::text AS owner,
            ci.linked_entity_type::text AS linked_entity_type,
            ci.linked_entity_id AS linked_entity_id,
            COALESCE(NULLIF(ci.title, ''), ci.linked_entity_id) AS linked_entity_name,
            ci.due_at::text AS due_date,
            ci.created_at::text AS created_at,
            COALESCE(
              ci.resolution_path,
              'Request missing upstream evidence via campaign or inbox. Status updates are owned by the upstream organisation.'
            ) AS resolution_path,
            'upstream_blocker'::text AS issue_kind,
            COALESCE(ci.owner_role, 'exporter')::text AS owner_role,
            owner_tcp.organization_name AS owner_organisation_name,
            CONCAT('issue_compliance_', ci.id::text) AS source_issue_id,
            false AS can_update_status
          FROM compliance_issues ci
          LEFT JOIN tenant_commercial_profiles owner_tcp ON owner_tcp.tenant_id = ci.tenant_id::text
          WHERE ci.tenant_id IS NOT NULL
            AND ci.tenant_id::text <> $1::text
            AND ci.status IN ('open', 'in_progress')
            AND EXISTS (
              SELECT 1
              FROM inbox_requests ir
              WHERE ir.recipient_tenant_id = $1::text
                AND ir.sender_tenant_id = ci.tenant_id::text
            )
            AND (
              (
                ci.linked_entity_type = 'tenure_verification'
                AND EXISTS (
                  SELECT 1
                  FROM plot_tenure_verification ptv
                  JOIN plot p ON p.id = ptv.plot_id
                  JOIN harvest_transaction ht ON ht.plot_id = p.id
                  JOIN voucher v ON v.transaction_id = ht.id
                  JOIN dds_package_voucher dpv ON dpv.voucher_id = v.id
                  JOIN dds_package dp ON dp.id = dpv.dds_package_id
                  JOIN farmer_profile fp ON fp.id = dp.farmer_id
                  JOIN tenant_signup_contacts tsc
                    ON tsc.tenant_id = ci.tenant_id::text
                   AND fp.user_id = NULLIF(tsc.user_id, '')::uuid
                  WHERE ptv.id::text = ci.linked_entity_id
                )
              )
              OR (
                ci.linked_entity_type = 'plot'
                AND EXISTS (
                  SELECT 1
                  FROM plot p
                  JOIN harvest_transaction ht ON ht.plot_id = p.id
                  JOIN voucher v ON v.transaction_id = ht.id
                  JOIN dds_package_voucher dpv ON dpv.voucher_id = v.id
                  JOIN dds_package dp ON dp.id = dpv.dds_package_id
                  JOIN farmer_profile fp ON fp.id = dp.farmer_id
                  JOIN tenant_signup_contacts tsc
                    ON tsc.tenant_id = ci.tenant_id::text
                   AND fp.user_id = NULLIF(tsc.user_id, '')::uuid
                  WHERE p.id::text = ci.linked_entity_id
                )
              )
            )
        `,
        [tenantId],
      );
      return result.rows.map((row) => this.normalizeOperationalIssue(row));
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async updateOperationalIssueStatus(
    tenantId: string,
    issueId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
  ): Promise<OperationalIssueRecord> {
    const prefix = 'issue_compliance_';
    if (!issueId.startsWith(prefix)) {
      throw new BadRequestException(
        'Only persisted compliance issues support manual status updates. Open the linked campaign or request to progress derived issues.',
      );
    }

    const complianceIssueId = issueId.slice(prefix.length);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(complianceIssueId)) {
      throw new BadRequestException('Invalid compliance issue id.');
    }

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      throw new BadRequestException('Invalid issue status.');
    }

    try {
      const result = await this.pool.query<OperationalIssueRecord>(
        `
          UPDATE compliance_issues ci
          SET
            status = $3,
            updated_at = NOW()
          FROM tenant_commercial_profiles owner_tcp
          WHERE ci.id = $2::uuid
            AND ci.tenant_id::text = $1::text
            AND owner_tcp.tenant_id = ci.tenant_id::text
          RETURNING
            CONCAT('issue_compliance_', ci.id::text) AS id,
            ci.title AS title,
            ci.description AS description,
            ci.severity AS severity,
            ci.status AS status,
            NULL::text AS owner,
            ci.linked_entity_type::text AS linked_entity_type,
            ci.linked_entity_id AS linked_entity_id,
            COALESCE(NULLIF(ci.title, ''), ci.linked_entity_id) AS linked_entity_name,
            ci.due_at::text AS due_date,
            ci.created_at::text AS created_at,
            COALESCE(
              ci.resolution_path,
              'Review the linked entity and update issue status when remediation is complete.'
            ) AS resolution_path,
            'canonical'::text AS issue_kind,
            COALESCE(ci.owner_role, 'exporter')::text AS owner_role,
            owner_tcp.organization_name AS owner_organisation_name,
            NULL::text AS source_issue_id,
            true AS can_update_status
        `,
        [tenantId, complianceIssueId, status],
      );

      const row = result.rows[0];
      if (!row) {
        throw new BadRequestException('Compliance issue not found.');
      }

      return this.normalizeOperationalIssue(row);
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        throw new BadRequestException('Compliance issues are not available in this environment.');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async listEvidenceFeed(tenantId: string, plotId?: string | null): Promise<EvidenceFeedRecord[]> {
    const scopedPlotId = plotId?.trim() || null;
    try {
      const result = await this.pool.query<EvidenceFeedRecord>(
        `
          SELECT
            CONCAT('evidence_', al.id::text, '_', item.ordinality::text) AS id,
            COALESCE(
              NULLIF(item.value ->> 'label', ''),
              NULLIF(item.value ->> 'name', ''),
              CONCAT('Plot evidence ', al.id::text)
            ) AS name,
            CASE al.payload ->> 'kind'
              WHEN 'fpic_repository' THEN 'consent_form'
              WHEN 'protected_area_permit' THEN 'affidavit'
              WHEN 'labor_evidence' THEN 'agreement'
              ELSE 'community_minutes'
            END AS type,
            COALESCE(
              NULLIF(item.value ->> 'community', ''),
              NULLIF(item.value ->> 'farmerName', ''),
              CONCAT('Plot ', COALESCE(al.payload ->> 'plotId', 'unknown'))
            ) AS farmer_or_community,
            NULLIF(al.payload ->> 'plotId', '') AS plot_id,
            al.timestamp::text AS upload_date,
            (al.timestamp + INTERVAL '365 days')::text AS expiry_date,
            CASE
              WHEN al.timestamp < NOW() - INTERVAL '365 days' THEN 'expired'
              WHEN al.timestamp < NOW() - INTERVAL '300 days' THEN 'renewal_due'
              ELSE 'pending_review'
            END AS status,
            1.0::float8 AS file_size_mb,
            md5(CONCAT(al.id::text, ':', item.value::text, ':', al.timestamp::text)) AS sha256_hash,
            COALESCE(al.user_id::text, 'Tracebud User') AS uploader_name,
            $1::text AS uploader_org,
            NULLIF(item.value ->> 'storagePath', '') AS storage_path,
            NULLIF(item.value ->> 'mimeType', '') AS mime_type,
            NULLIF(al.payload ->> 'kind', '') AS evidence_kind,
            (NULLIF(item.value ->> 'storagePath', '') IS NOT NULL) AS has_file,
            (NULLIF(item.value ->> 'storagePath', '') IS NULL) AS metadata_only
          FROM audit_log al
          LEFT JOIN LATERAL jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(al.payload -> 'items') = 'array' THEN al.payload -> 'items'
              ELSE '[]'::jsonb
            END
          ) WITH ORDINALITY AS item(value, ordinality) ON TRUE
          WHERE al.event_type = 'plot_evidence_synced'
            AND COALESCE(al.payload ->> 'tenantId', '') = $1
            AND ($2::text IS NULL OR NULLIF(al.payload ->> 'plotId', '') = $2)
            AND item.value IS NOT NULL
          ORDER BY al.timestamp DESC, item.ordinality ASC
          LIMIT 100
        `,
        [tenantId, scopedPlotId],
      );
      const rows = result.rows.map((row) => ({
        ...row,
        upload_date: new Date(row.upload_date).toISOString(),
        expiry_date: new Date(row.expiry_date).toISOString(),
        has_file: row.has_file === true,
        metadata_only: row.metadata_only === true,
      }));

      const scoped: EvidenceFeedRecord[] = [];
      for (const row of rows) {
        if (!row.plot_id?.trim()) {
          continue;
        }
        if (await this.consentService.canTenantAccessPlot(row.plot_id.trim(), tenantId)) {
          scoped.push(row);
        }
      }
      return scoped;
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async createEvidenceSignedUrl(
    tenantId: string,
    storagePath: string,
  ): Promise<{ signed_url: string; expires_in: number }> {
    const normalized = storagePath.trim().replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Invalid evidence storage path.');
    }

    const segments = normalized.split('/').filter(Boolean);
    const authUserId = segments[0];
    if (!authUserId || !/^[0-9a-f-]{36}$/i.test(authUserId)) {
      throw new BadRequestException('Evidence storage path must start with a producer auth user id.');
    }

    const farmerRes = await this.pool.query<{ id: string }>(
      `SELECT id FROM farmer_profile WHERE user_id = $1::uuid LIMIT 1`,
      [authUserId],
    );
    const farmerId = farmerRes.rows[0]?.id;
    if (!farmerId) {
      throw new ForbiddenException('Producer profile not found for this evidence file.');
    }

    const allowed = await this.consentService.canTenantAccessFarmerEvidence(farmerId, tenantId);
    if (!allowed) {
      throw new ForbiddenException('Tenant does not have consent to view this evidence file.');
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException('Evidence storage signing is not configured.');
    }

    const bucket = process.env.EVIDENCE_STORAGE_BUCKET?.trim() || 'plot-evidence';
    const supabase = createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalized, EVIDENCE_SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new BadRequestException(error?.message ?? 'Could not create signed URL for evidence file.');
    }

    return { signed_url: data.signedUrl, expires_in: EVIDENCE_SIGNED_URL_TTL_SECONDS };
  }
}

