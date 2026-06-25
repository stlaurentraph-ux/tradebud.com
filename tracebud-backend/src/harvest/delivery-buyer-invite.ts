import { Pool } from 'pg';
import {
  formatResendFromAddressOnBehalf,
  getDashboardPublicUrl,
  getResendClient,
  getResendReplyTo,
  isResendConfigured,
} from '../common/resend-mail';
import {
  buildDeliveryBuyerInviteSubject,
  buildDeliveryBuyerInviteTemplateVars,
  getDeliveryBuyerInviteReminderTemplateId,
  buildDeliveryBuyerInviteReminderSubject,
  renderOnboardingEmailHtml,
  renderOnboardingEmailText,
  type OnboardingEmailTemplateId,
  type OnboardingEmailTemplateVars,
} from '../launch/onboarding-email.templates';

export type DeliveryBuyerInviteResult = {
  email: string;
  pending: true;
  inviteSent: boolean;
};

export type RemindUnclaimedDeliveryInvitesResult = {
  scanned: number;
  sent: number;
  skipped: number;
  failures: string[];
};

export type DeliveryInviteEmailContext = {
  recipientEmail: string;
  farmerId: string;
  deliveryKg?: number | null;
  deliveryDate?: string | Date | null;
  tripRef?: string | null;
};

type InviteRow = {
  id: string;
  voucher_id: string;
  farmer_id: string;
  recipient_email: string;
  reminder_nudge_count: number;
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

export async function resolveProducerLabel(pool: Pool, farmerId: string): Promise<string> {
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

export async function resolveDeliveryInviteContext(
  pool: Pool,
  input: { voucherId: string; farmerId: string; recipientEmail: string },
): Promise<DeliveryInviteEmailContext> {
  const email = normalizeEmail(input.recipientEmail);
  try {
    const res = await pool.query<{
      kg: number | null;
      harvest_date: string | Date | null;
      delivery_trip_ref: string | null;
    }>(
      `
        SELECT ht.kg, ht.harvest_date, v.delivery_trip_ref
        FROM voucher v
        JOIN harvest_transaction ht ON ht.id = v.transaction_id
        WHERE v.id = $1
        LIMIT 1
      `,
      [input.voucherId],
    );
    const row = res.rows[0];
    return {
      recipientEmail: email,
      farmerId: input.farmerId,
      deliveryKg: row?.kg ?? null,
      deliveryDate: row?.harvest_date ?? null,
      tripRef: row?.delivery_trip_ref ?? null,
    };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return { recipientEmail: email, farmerId: input.farmerId };
    }
    throw error;
  }
}

function buildTemplateVars(
  input: DeliveryInviteEmailContext & { producerLabel: string },
): OnboardingEmailTemplateVars {
  return buildDeliveryBuyerInviteTemplateVars({
    recipientEmail: input.recipientEmail,
    producerLabel: input.producerLabel,
    dashboardBaseUrl: getDashboardPublicUrl(),
    deliveryKg: input.deliveryKg,
    deliveryDate: input.deliveryDate,
    tripRef: input.tripRef,
  });
}

async function sendDeliveryInviteEmail(input: {
  recipientEmail: string;
  producerLabel: string;
  templateId: OnboardingEmailTemplateId;
  subject: string;
  templateVars: OnboardingEmailTemplateVars;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    return false;
  }

  const from = formatResendFromAddressOnBehalf(input.producerLabel);
  const resend = getResendClient();
  const result = await resend.emails.send({
    from,
    to: input.recipientEmail,
    replyTo: getResendReplyTo(from),
    subject: input.subject,
    html: renderOnboardingEmailHtml(input.templateId, input.templateVars),
    text: renderOnboardingEmailText(input.templateId, input.templateVars),
  });

  return !result.error;
}

async function sendInviteEmail(
  pool: Pool,
  input: DeliveryInviteEmailContext,
): Promise<boolean> {
  const producerLabel = await resolveProducerLabel(pool, input.farmerId);
  const templateVars = buildTemplateVars({ ...input, producerLabel });
  return sendDeliveryInviteEmail({
    recipientEmail: input.recipientEmail,
    producerLabel,
    templateId: 'delivery-buyer-invite',
    subject: buildDeliveryBuyerInviteSubject(producerLabel),
    templateVars,
  });
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
    deliveryKg?: number | null;
    deliveryDate?: string | Date | null;
    tripRef?: string | null;
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

  const emailContext: DeliveryInviteEmailContext = {
    recipientEmail: email,
    farmerId: input.farmerId,
    deliveryKg: input.deliveryKg,
    deliveryDate: input.deliveryDate,
    tripRef: input.tripRef,
  };

  let inviteSent = false;
  if (isResendConfigured()) {
    try {
      inviteSent = await sendInviteEmail(pool, emailContext);
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

async function sendReminderForRow(pool: Pool, row: InviteRow): Promise<'sent' | 'skipped' | string> {
  const recipientEmail = normalizeEmail(row.recipient_email);
  const producerLabel = await resolveProducerLabel(pool, row.farmer_id);
  const deliveryContext = await resolveDeliveryInviteContext(pool, {
    voucherId: row.voucher_id,
    farmerId: row.farmer_id,
    recipientEmail,
  });
  const templateId = getDeliveryBuyerInviteReminderTemplateId(row.reminder_nudge_count);
  const templateVars = buildTemplateVars({ ...deliveryContext, producerLabel });
  const subject = buildDeliveryBuyerInviteReminderSubject(producerLabel, row.reminder_nudge_count);

  try {
    const sent = await sendDeliveryInviteEmail({
      recipientEmail,
      producerLabel,
      templateId,
      subject,
      templateVars,
    });
    if (!sent) {
      return 'resend send failed';
    }

    await pool.query(
      `
        UPDATE voucher_buyer_invites
        SET
          reminder_nudge_sent_at = NOW(),
          reminder_nudge_count = reminder_nudge_count + 1
        WHERE id = $1
      `,
      [row.id],
    );

    await emitInviteAudit(pool, 'delivery_buyer_invite_reminder_sent', {
      invite_id: row.id,
      voucher_id: row.voucher_id,
      recipient_email: recipientEmail,
      template_id: templateId,
      reminder_nudge_count: row.reminder_nudge_count + 1,
    });

    return 'sent';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Cron: remind buyers who received invite email but have not claimed (max 2 reminders).
 * First reminder: 72h after sent_at. Final reminder: 96h after first reminder.
 */
export async function remindUnclaimedDeliveryBuyerInvites(
  pool: Pool,
): Promise<RemindUnclaimedDeliveryInvitesResult> {
  const result: RemindUnclaimedDeliveryInvitesResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    failures: [],
  };

  if (!isResendConfigured()) {
    return result;
  }

  let candidates: { rows: InviteRow[] };
  try {
    candidates = await pool.query<InviteRow>(
      `
        SELECT id, voucher_id, farmer_id, recipient_email, reminder_nudge_count
        FROM voucher_buyer_invites
        WHERE status = 'sent'
          AND reminder_nudge_count < 2
          AND (
            (
              reminder_nudge_count = 0
              AND sent_at IS NOT NULL
              AND sent_at <= NOW() - INTERVAL '72 hours'
            )
            OR (
              reminder_nudge_count = 1
              AND reminder_nudge_sent_at IS NOT NULL
              AND reminder_nudge_sent_at <= NOW() - INTERVAL '96 hours'
            )
          )
        ORDER BY sent_at ASC
        LIMIT 50
      `,
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42703') {
      result.skipped += 1;
      return result;
    }
    throw error;
  }

  result.scanned = candidates.rows.length;
  for (const row of candidates.rows) {
    const outcome = await sendReminderForRow(pool, row);
    if (outcome === 'sent') {
      result.sent += 1;
    } else if (outcome === 'skipped') {
      result.skipped += 1;
    } else {
      result.failures.push(`${row.recipient_email}: ${outcome}`);
    }
  }

  return result;
}
