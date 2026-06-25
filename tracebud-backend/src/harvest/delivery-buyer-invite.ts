import { Pool } from 'pg';
import {
  formatResendFromAddress,
  getDashboardPublicUrl,
  getResendClient,
  getResendReplyTo,
  isResendConfigured,
} from '../common/resend-mail';
import {
  buildDeliveryBuyerInviteTemplateVars,
  ONBOARDING_EMAIL_SUBJECTS,
  renderOnboardingEmailHtml,
  renderOnboardingEmailText,
} from '../launch/onboarding-email.templates';

export type DeliveryBuyerInviteResult = {
  email: string;
  pending: true;
  inviteSent: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

async function upsertInviteRow(
  pool: Pool,
  input: { voucherId: string; farmerId: string; recipientEmail: string },
): Promise<void> {
  try {
    await pool.query(
      `
        INSERT INTO voucher_buyer_invites (voucher_id, farmer_id, recipient_email, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (voucher_id, recipient_email) DO NOTHING
      `,
      [input.voucherId, input.farmerId, input.recipientEmail],
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return;
    }
    throw error;
  }
}

async function resolveProducerLabel(pool: Pool, farmerId: string): Promise<string> {
  try {
    const res = await pool.query<{ label: string | null }>(
      `
        SELECT COALESCE(NULLIF(TRIM(ua.name), ''), NULLIF(TRIM(fp.id::text), '')) AS label
        FROM farmer_profile fp
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        WHERE fp.id = $1
        LIMIT 1
      `,
      [farmerId],
    );
    const label = res.rows[0]?.label?.trim();
    return label && !/^[0-9a-f-]{36}$/i.test(label) ? label : 'A Tracebud producer';
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return 'A Tracebud producer';
    }
    throw error;
  }
}

async function sendInviteEmail(
  pool: Pool,
  input: { recipientEmail: string; farmerId: string },
): Promise<boolean> {
  if (!isResendConfigured()) {
    return false;
  }

  const dashboardBaseUrl = getDashboardPublicUrl();
  const producerLabel = await resolveProducerLabel(pool, input.farmerId);
  const templateVars = buildDeliveryBuyerInviteTemplateVars({
    recipientEmail: input.recipientEmail,
    producerLabel,
    dashboardBaseUrl,
  });

  const from = formatResendFromAddress();
  const resend = getResendClient();
  const result = await resend.emails.send({
    from,
    to: input.recipientEmail,
    replyTo: getResendReplyTo(from),
    subject: ONBOARDING_EMAIL_SUBJECTS['delivery-buyer-invite'],
    html: renderOnboardingEmailHtml('delivery-buyer-invite', templateVars),
    text: renderOnboardingEmailText('delivery-buyer-invite', templateVars),
  });

  return !result.error;
}

/**
 * Persist pending buyer invite and send onboarding-style email when Resend is configured.
 */
export async function queueDeliveryBuyerInvite(
  pool: Pool,
  input: {
    voucherId: string;
    farmerId: string;
    recipientEmail: string;
    actorUserId?: string | null;
  },
): Promise<DeliveryBuyerInviteResult> {
  const email = normalizeEmail(input.recipientEmail);

  await upsertInviteRow(pool, {
    voucherId: input.voucherId,
    farmerId: input.farmerId,
    recipientEmail: email,
  });

  await emitInviteAudit(pool, 'delivery_buyer_invite_queued', {
    voucher_id: input.voucherId,
    farmer_id: input.farmerId,
    recipient_email: email,
    actor_user_id: input.actorUserId ?? null,
  });

  let inviteSent = false;
  if (isResendConfigured()) {
    try {
      inviteSent = await sendInviteEmail(pool, {
        recipientEmail: email,
        farmerId: input.farmerId,
      });
      if (inviteSent) {
        await pool.query(
          `
            UPDATE voucher_buyer_invites
            SET status = 'sent', sent_at = NOW()
            WHERE voucher_id = $1 AND lower(recipient_email) = $2
          `,
          [input.voucherId, email],
        );
        await emitInviteAudit(pool, 'delivery_buyer_invite_sent', {
          voucher_id: input.voucherId,
          farmer_id: input.farmerId,
          recipient_email: email,
          template_id: 'delivery-buyer-invite',
        });
      }
    } catch (error) {
      await emitInviteAudit(pool, 'delivery_buyer_invite_send_failed', {
        voucher_id: input.voucherId,
        farmer_id: input.farmerId,
        recipient_email: email,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    await emitInviteAudit(pool, 'delivery_buyer_invite_send_skipped', {
      voucher_id: input.voucherId,
      farmer_id: input.farmerId,
      recipient_email: email,
      reason: 'resend_not_configured',
    });
  }

  return { email, pending: true, inviteSent };
}
