import { Pool } from 'pg';
import {
  formatResendFromAddressOnBehalf,
  getDashboardPublicUrl,
  getResendClient,
  getResendReplyTo,
  isResendConfigured,
} from '../common/resend-mail';
import { resolveCampaignSenderRoleFromSignals } from '../common/cold-recipient-email-copy';
import {
  buildCampaignRequestInviteReminderSubject,
  buildCampaignRequestInviteSubject,
  buildCampaignRequestInviteTemplateVars,
  getCampaignRequestInviteReminderTemplateId,
} from './campaign-request-email.templates';
import { renderOnboardingEmailHtml, renderOnboardingEmailText } from '../launch/onboarding-email.templates';

type CampaignDeliveryRecipient = {
  contact_id: string;
  email: string | null;
};

type CampaignEmailDispatchContext = {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  request_type?: string | null;
  due_at: string | Date;
};

type ReminderInviteCandidate = {
  id: string;
  campaign_id: string;
  sender_tenant_id: string;
  recipient_email: string;
  reminder_nudge_count: number;
  title: string;
  description: string | null;
  request_type: string | null;
  due_at: string | Date;
  sender_org_label: string | null;
  sender_role: string | null;
  recipient_contact_type: string | null;
};

export type DispatchCampaignRequestEmailsResult = {
  sentCount: number;
  failedCount: number;
  failureMessages: string[];
  sentEmails: string[];
  sentDeliveries: CampaignDeliveryRecipient[];
};

export type RemindUnclaimedCampaignRecipientInvitesResult = {
  scanned: number;
  sent: number;
  skipped: number;
  failures: string[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getDocsBaseUrl(): string {
  const raw = process.env.TRACEBUD_DOCS_URL?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://docs.tracebud.com';
}

function formatDueDateLabel(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function emitInviteAudit(
  pool: Pool,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
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

async function resolveSenderOrganizationLabel(pool: Pool, tenantId: string): Promise<string> {
  try {
    const res = await pool.query<{ label: string | null }>(
      `
        SELECT COALESCE(
          NULLIF(TRIM(organization_name), ''),
          NULLIF(TRIM(commercial_name), ''),
          NULLIF(TRIM(legal_name), '')
        ) AS label
        FROM tenant_commercial_profiles
        WHERE tenant_id = $1
        LIMIT 1
      `,
      [tenantId],
    );
    const label = res.rows[0]?.label?.trim();
    return label || 'A Tracebud organization';
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return 'A Tracebud organization';
    }
    throw error;
  }
}

export async function resolveSenderPrimaryRole(pool: Pool, tenantId: string): Promise<string> {
  const cleanTenantId = tenantId.trim();
  if (!cleanTenantId) {
    return 'other';
  }

  let supplyChainRoles: string[] = [];
  let primaryRole: string | null = null;

  try {
    const profile = await pool.query<{ roles: string[] | null; primary_role: string | null }>(
      `
        SELECT supply_chain_roles AS roles, primary_role
        FROM tenant_commercial_profiles
        WHERE tenant_id = $1
        LIMIT 1
      `,
      [cleanTenantId],
    );
    supplyChainRoles = profile.rows[0]?.roles ?? [];
    primaryRole = profile.rows[0]?.primary_role ?? null;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01' && code !== '42703') {
      throw error;
    }
  }

  let adminRoles: string[] = [];
  try {
    const admin = await pool.query<{ roles: string[] | null }>(
      `
        SELECT roles
        FROM admin_users
        WHERE tenant_id = $1
        ORDER BY invited_at DESC
        LIMIT 1
      `,
      [cleanTenantId],
    );
    adminRoles = admin.rows[0]?.roles ?? [];
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01' && code !== '42703') {
      throw error;
    }
  }

  return resolveCampaignSenderRoleFromSignals({
    supplyChainRoles,
    primaryRole,
    adminRoles,
  });
}

export async function resolveCampaignRecipientContactTypes(
  pool: Pool,
  tenantId: string,
  deliveries: readonly CampaignDeliveryRecipient[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const contactIds = deliveries
    .map((delivery) => delivery.contact_id)
    .filter((id) => Boolean(id) && !id.startsWith('legacy:'));

  if (contactIds.length > 0) {
    try {
      const byId = await pool.query<{ id: string; contact_type: string }>(
        `
          SELECT id, contact_type
          FROM crm_contacts
          WHERE tenant_id = $1
            AND id = ANY($2::text[])
        `,
        [tenantId, contactIds],
      );
      for (const row of byId.rows) {
        result.set(row.id, row.contact_type || 'other');
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01') {
        throw error;
      }
    }
  }

  const emails = Array.from(
    new Set(
      deliveries
        .map((delivery) => delivery.email)
        .filter((email): email is string => Boolean(email))
        .map((email) => normalizeEmail(email)),
    ),
  );

  if (emails.length > 0) {
    try {
      const byEmail = await pool.query<{ email: string; contact_type: string }>(
        `
          SELECT lower(email) AS email, contact_type
          FROM crm_contacts
          WHERE tenant_id = $1
            AND lower(email) = ANY($2::text[])
        `,
        [tenantId, emails],
      );
      for (const row of byEmail.rows) {
        result.set(row.email, row.contact_type || 'other');
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01') {
        throw error;
      }
    }
  }

  return result;
}

async function sendCampaignRequestEmail(input: {
  toEmail: string;
  senderOrgLabel: string;
  subject: string;
  templateId: 'campaign-request-invite' | 'campaign-request-invite-reminder' | 'campaign-request-invite-reminder-final';
  templateVars: ReturnType<typeof buildCampaignRequestInviteTemplateVars>;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    return false;
  }

  const from = formatResendFromAddressOnBehalf(input.senderOrgLabel);
  const resend = getResendClient();
  const result = await resend.emails.send({
    from,
    to: input.toEmail,
    replyTo: getResendReplyTo(from),
    subject: input.subject,
    html: renderOnboardingEmailHtml(input.templateId, input.templateVars),
    text: renderOnboardingEmailText(input.templateId, input.templateVars),
  });

  return !result.error;
}

function buildDecisionUrls(campaignId: string, recipientEmail: string): {
  acceptUrl: string;
  refuseUrl: string;
} {
  const dashboardBase = getDashboardPublicUrl();
  const campaignParam = encodeURIComponent(campaignId);
  const recipientParam = encodeURIComponent(recipientEmail);
  return {
    acceptUrl: `${dashboardBase}/requests/intent?campaign=${campaignParam}&decision=accept&recipient=${recipientParam}`,
    refuseUrl: `${dashboardBase}/requests/intent?campaign=${campaignParam}&decision=refuse&recipient=${recipientParam}`,
  };
}

export async function dispatchCampaignRequestEmails(
  pool: Pool,
  campaign: CampaignEmailDispatchContext,
  emailDeliveries: readonly CampaignDeliveryRecipient[],
): Promise<DispatchCampaignRequestEmailsResult> {
  if (!isResendConfigured()) {
    return {
      sentCount: 0,
      failedCount: emailDeliveries.length,
      failureMessages: ['resend_not_configured'],
      sentEmails: [],
      sentDeliveries: [],
    };
  }

  const senderOrgLabel = await resolveSenderOrganizationLabel(pool, campaign.tenant_id);
  const senderRole = await resolveSenderPrimaryRole(pool, campaign.tenant_id);
  const contactTypes = await resolveCampaignRecipientContactTypes(pool, campaign.tenant_id, emailDeliveries);
  const docsUrl = `${getDocsBaseUrl()}/getting-started/compliance-requests`;
  const dashboardBase = getDashboardPublicUrl();
  const dueDateLabel = formatDueDateLabel(campaign.due_at);

  const settled = await Promise.allSettled(
    emailDeliveries.map(async (delivery) => {
      const rawEmail = delivery.email;
      if (!rawEmail) {
        throw new Error('missing_recipient_email');
      }
      const toEmail = normalizeEmail(rawEmail);
      const contactType = contactTypes.get(delivery.contact_id) ?? contactTypes.get(toEmail) ?? 'other';
      const isFarmer = contactType === 'farmer';
      const connectUrl = isFarmer
        ? `${process.env.TRACEBUD_FIELD_AUTH_PUBLIC_URL?.trim()?.replace(/\/$/, '') || 'https://field.tracebud.com'}/campaign?campaign=${encodeURIComponent(campaign.id)}`
        : `${dashboardBase}/create-account?campaign=${encodeURIComponent(campaign.id)}`;
      const { acceptUrl, refuseUrl } = buildDecisionUrls(campaign.id, toEmail);
      const templateVars = buildCampaignRequestInviteTemplateVars({
        recipientEmail: toEmail,
        senderOrgLabel,
        senderRole,
        recipientContactType: contactType,
        campaignTitle: campaign.title,
        campaignDescription: campaign.description,
        dueDateLabel,
        requestTypeLabel: campaign.request_type,
        connectUrl,
        acceptUrl,
        refuseUrl,
        docsUrl,
        dashboardBaseUrl: dashboardBase,
      });
      const subject = buildCampaignRequestInviteSubject(senderOrgLabel, senderRole);
      const sent = await sendCampaignRequestEmail({
        toEmail,
        senderOrgLabel,
        subject,
        templateId: 'campaign-request-invite',
        templateVars,
      });
      if (!sent) {
        throw new Error(`resend_rejected:${toEmail}`);
      }
      return toEmail;
    }),
  );

  const sentDeliveries = settled
    .map((entry, idx) => (entry.status === 'fulfilled' ? emailDeliveries[idx] ?? null : null))
    .filter((row): row is CampaignDeliveryRecipient => Boolean(row));
  const sentEmails = settled
    .filter((entry): entry is PromiseFulfilledResult<string> => entry.status === 'fulfilled')
    .map((entry) => entry.value);
  const failureMessages = settled
    .filter((entry): entry is PromiseRejectedResult => entry.status === 'rejected')
    .map((entry) => (entry.reason instanceof Error ? entry.reason.message : String(entry.reason)));

  return {
    sentCount: sentEmails.length,
    failedCount: failureMessages.length,
    failureMessages,
    sentEmails,
    sentDeliveries,
  };
}

async function sendCampaignRequestReminderForInvite(
  pool: Pool,
  invite: ReminderInviteCandidate,
): Promise<'sent' | string> {
  const recipientEmail = normalizeEmail(invite.recipient_email);
  const senderOrgLabel = invite.sender_org_label?.trim() || (await resolveSenderOrganizationLabel(pool, invite.sender_tenant_id));
  const senderRole = invite.sender_role?.trim() || (await resolveSenderPrimaryRole(pool, invite.sender_tenant_id));
  const dashboardBase = getDashboardPublicUrl();
  const docsUrl = `${getDocsBaseUrl()}/getting-started/compliance-requests`;
  const contactType = invite.recipient_contact_type ?? 'other';
  const isFarmer = contactType === 'farmer';
  const connectUrl = isFarmer
    ? `${process.env.TRACEBUD_FIELD_AUTH_PUBLIC_URL?.trim()?.replace(/\/$/, '') || 'https://field.tracebud.com'}/campaign?campaign=${encodeURIComponent(invite.campaign_id)}`
    : `${dashboardBase}/create-account?campaign=${encodeURIComponent(invite.campaign_id)}`;
  const { acceptUrl, refuseUrl } = buildDecisionUrls(invite.campaign_id, recipientEmail);
  const templateVars = buildCampaignRequestInviteTemplateVars({
    recipientEmail,
    senderOrgLabel,
    senderRole,
    recipientContactType: contactType,
    campaignTitle: invite.title,
    campaignDescription: invite.description,
    dueDateLabel: formatDueDateLabel(invite.due_at),
    requestTypeLabel: invite.request_type,
    connectUrl,
    acceptUrl,
    refuseUrl,
    docsUrl,
    dashboardBaseUrl: dashboardBase,
  });
  const templateId = getCampaignRequestInviteReminderTemplateId(invite.reminder_nudge_count);
  const subject = buildCampaignRequestInviteReminderSubject(
    senderOrgLabel,
    invite.reminder_nudge_count,
    senderRole,
  );
  try {
    const sent = await sendCampaignRequestEmail({
      toEmail: recipientEmail,
      senderOrgLabel,
      subject,
      templateId,
      templateVars,
    });
    if (!sent) {
      return 'resend_send_failed';
    }

    await pool.query(
      `
        UPDATE campaign_recipient_invites
        SET
          reminder_nudge_sent_at = NOW(),
          reminder_nudge_count = reminder_nudge_count + 1
        WHERE id = $1
      `,
      [invite.id],
    );

    await emitInviteAudit(pool, 'campaign_recipient_invite_reminder_sent', {
      invite_id: invite.id,
      campaign_id: invite.campaign_id,
      recipient_email: recipientEmail,
      template_id: templateId,
      reminder_nudge_count: invite.reminder_nudge_count + 1,
    });
    return 'sent';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function remindUnclaimedCampaignRecipientInvites(
  pool: Pool,
): Promise<RemindUnclaimedCampaignRecipientInvitesResult> {
  const result: RemindUnclaimedCampaignRecipientInvitesResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    failures: [],
  };

  if (!isResendConfigured()) {
    return result;
  }

  let candidates: { rows: ReminderInviteCandidate[] };
  try {
    candidates = await pool.query<ReminderInviteCandidate>(
      `
        SELECT
          cri.id,
          cri.campaign_id,
          cri.sender_tenant_id,
          cri.recipient_email,
          cri.reminder_nudge_count,
          rc.title,
          rc.description,
          rc.request_type,
          rc.due_at,
          COALESCE(
            NULLIF(TRIM(tcp.organization_name), ''),
            NULLIF(TRIM(tcp.commercial_name), ''),
            NULLIF(TRIM(tcp.legal_name), '')
          ) AS sender_org_label,
          NULL::text AS sender_role,
          cc.contact_type AS recipient_contact_type
        FROM campaign_recipient_invites cri
        JOIN request_campaigns rc
          ON rc.id = cri.campaign_id
        LEFT JOIN tenant_commercial_profiles tcp
          ON tcp.tenant_id = cri.sender_tenant_id
        LEFT JOIN crm_contacts cc
          ON cc.tenant_id = cri.sender_tenant_id
         AND lower(cc.email) = lower(cri.recipient_email)
        WHERE cri.status = 'sent'
          AND cri.reminder_nudge_count < 2
          AND (
            (
              cri.reminder_nudge_count = 0
              AND cri.sent_at IS NOT NULL
              AND cri.sent_at <= NOW() - INTERVAL '72 hours'
            )
            OR (
              cri.reminder_nudge_count = 1
              AND cri.reminder_nudge_sent_at IS NOT NULL
              AND cri.reminder_nudge_sent_at <= NOW() - INTERVAL '96 hours'
            )
          )
        ORDER BY cri.sent_at ASC
        LIMIT 50
      `,
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      result.skipped += 1;
      return result;
    }
    throw error;
  }

  result.scanned = candidates.rows.length;
  for (const invite of candidates.rows) {
    const outcome = await sendCampaignRequestReminderForInvite(pool, invite);
    if (outcome === 'sent') {
      result.sent += 1;
    } else {
      result.failures.push(`${invite.recipient_email}: ${outcome}`);
    }
  }

  return result;
}
