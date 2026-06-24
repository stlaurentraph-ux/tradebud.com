import { Pool } from 'pg';
import {
  formatResendFromAddress,
  getDashboardPublicUrl,
  getResendClient,
  getResendReplyTo,
  isResendConfigured,
} from '../common/resend-mail';

export interface CampaignRecipientInviteParams {
  campaignId: string;
  senderTenantId: string;
  recipientEmails: string[];
  actorUserId: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function emitBatchAudit(
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
    if (code === '42P01') return;
    throw error;
  }
}

async function upsertRecipientInviteRow(
  pool: Pool,
  input: { campaignId: string; senderTenantId: string; recipientEmail: string },
): Promise<void> {
  try {
    await pool.query(
      `
        INSERT INTO request_campaign_recipient_invites
          (campaign_id, sender_tenant_id, recipient_email, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (campaign_id, recipient_email) DO NOTHING
      `,
      [input.campaignId, input.senderTenantId, input.recipientEmail],
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') return;
    throw error;
  }
}

async function sendCampaignInviteEmail(recipientEmail: string): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const dashboardBaseUrl = getDashboardPublicUrl();
  const signupUrl = `${dashboardBaseUrl}/create-account`;
  const from = formatResendFromAddress();
  const resend = getResendClient();

  const result = await resend.emails.send({
    from,
    to: recipientEmail,
    replyTo: getResendReplyTo(from),
    subject: 'You have been invited to join Tracebud',
    html: `<p>You have been invited to join Tracebud. <a href="${signupUrl}">Create your account</a></p>`,
    text: `You have been invited to join Tracebud. Create your account: ${signupUrl}`,
  });

  return !result.error;
}

/**
 * Queue invitations for campaign recipients who do not yet have a Tracebud account.
 * Non-blocking: caller wraps in try/catch and logs failures to audit_log.
 */
export async function queueCampaignRecipientInvites(
  pool: Pool,
  params: CampaignRecipientInviteParams,
): Promise<void> {
  const { campaignId, senderTenantId, recipientEmails, actorUserId } = params;
  if (recipientEmails.length === 0) return;

  const emails = recipientEmails.map(normalizeEmail);

  for (const email of emails) {
    await upsertRecipientInviteRow(pool, { campaignId, senderTenantId, recipientEmail: email });
  }

  await emitBatchAudit(pool, 'campaign_recipient_invites_queued', {
    campaign_id: campaignId,
    sender_tenant_id: senderTenantId,
    recipient_emails: emails,
    actor_user_id: actorUserId,
  });

  if (isResendConfigured()) {
    for (const email of emails) {
      try {
        await sendCampaignInviteEmail(email);
      } catch {
        await emitBatchAudit(pool, 'campaign_recipient_invite_queued', {
          campaign_id: campaignId,
          sender_tenant_id: senderTenantId,
          recipient_email: email,
          actor_user_id: actorUserId,
          status: 'send_failed',
        });
      }
    }
  }
}
