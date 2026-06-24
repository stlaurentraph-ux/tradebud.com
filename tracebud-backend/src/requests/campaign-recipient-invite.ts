import { Pool } from 'pg';

export type QueueCampaignRecipientInvitesResult = {
  queuedCount: number;
  skippedResolvedCount: number;
};

export type CampaignInviteDelivery = {
  contact_id: string;
  delivery_channel: 'email' | 'whatsapp' | 'sms' | 'desk_only';
  delivery_address: string | null;
  recipient_email?: string | null;
  claim_token_hash?: string | null;
  claim_expires_at?: string | null;
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

async function resolveTenantIdsByEmail(
  pool: Pool,
  emails: readonly string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const normalized = Array.from(
    new Set(
      emails
        .map((email) => normalizeEmail(email))
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  );

  if (normalized.length === 0) {
    return resolved;
  }

  try {
    const signupRes = await pool.query<{ email: string; tenant_id: string }>(
      `
        SELECT LOWER(email) AS email, tenant_id
        FROM tenant_signup_contacts
        WHERE LOWER(email) = ANY($1::text[])
      `,
      [normalized],
    );
    for (const row of signupRes.rows) {
      resolved.set(row.email, row.tenant_id);
    }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }

  const unresolved = normalized.filter((email) => !resolved.has(email));
  if (unresolved.length === 0) {
    return resolved;
  }

  try {
    const adminRes = await pool.query<{ email: string; tenant_id: string }>(
      `
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email) AS email,
          tenant_id
        FROM admin_users
        WHERE LOWER(email) = ANY($1::text[])
        ORDER BY LOWER(email), invited_at DESC
      `,
      [unresolved],
    );
    for (const row of adminRes.rows) {
      if (!resolved.has(row.email)) {
        resolved.set(row.email, row.tenant_id);
      }
    }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }

  return resolved;
}

function normalizeDeliveries(
  deliveries: readonly CampaignInviteDelivery[] | undefined,
  recipientEmails: readonly string[] | undefined,
): CampaignInviteDelivery[] {
  if (deliveries && deliveries.length > 0) {
    return deliveries
      .filter((delivery) => delivery.contact_id?.trim())
      .map((delivery) => ({
        contact_id: delivery.contact_id.trim(),
        delivery_channel: delivery.delivery_channel,
        delivery_address: delivery.delivery_address?.trim() || null,
        recipient_email: delivery.recipient_email?.trim().toLowerCase() || null,
        claim_token_hash: delivery.claim_token_hash?.trim() || null,
        claim_expires_at: delivery.claim_expires_at?.trim() || null,
      }));
  }

  return Array.from(
    new Set(
      (recipientEmails ?? [])
        .map((email) => normalizeEmail(email))
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  ).map((email) => ({
    contact_id: `legacy:${email}`,
    delivery_channel: 'email' as const,
    delivery_address: email,
    recipient_email: email,
  }));
}

/**
 * After a campaign send, persist invite rows for recipients without a workspace tenant.
 * Email-channel invites skip when the address already resolves to a tenant.
 * Desk-only invites are always queued for cooperative follow-up until WhatsApp (P3).
 */
export async function queueCampaignRecipientInvites(
  pool: Pool,
  input: {
    campaignId: string;
    senderTenantId: string;
    recipientEmails?: readonly string[];
    deliveries?: readonly CampaignInviteDelivery[];
    actorUserId?: string | null;
  },
): Promise<QueueCampaignRecipientInvitesResult> {
  const campaignId = input.campaignId.trim();
  const senderTenantId = input.senderTenantId.trim();
  const rows = normalizeDeliveries(input.deliveries, input.recipientEmails);

  if (!campaignId || !senderTenantId || rows.length === 0) {
    return { queuedCount: 0, skippedResolvedCount: 0 };
  }

  const emailRecipients = rows
    .map((row) => row.recipient_email)
    .filter((email): email is string => Boolean(email));
  const tenantByEmail = await resolveTenantIdsByEmail(pool, emailRecipients);
  let queuedCount = 0;
  let skippedResolvedCount = 0;

  for (const delivery of rows) {
    const recipientEmail = delivery.recipient_email;
    if (delivery.delivery_channel === 'email' && recipientEmail) {
      const resolvedTenantId = tenantByEmail.get(recipientEmail);
      if (resolvedTenantId) {
        skippedResolvedCount += 1;
        continue;
      }
    }

    const contactId = delivery.contact_id.startsWith('legacy:') ? null : delivery.contact_id;
    const inviteStatus = delivery.delivery_channel === 'desk_only' ? 'pending' : 'sent';

    let inviteId: string | null = null;
    try {
      if (contactId) {
        const upsert = await pool.query<{ id: string }>(
          `
            INSERT INTO campaign_recipient_invites (
              campaign_id,
              sender_tenant_id,
              contact_id,
              recipient_email,
              delivery_channel,
              delivery_address,
              claim_token_hash,
              claim_expires_at,
              status,
              sent_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, CASE WHEN $9 = 'sent' THEN NOW() ELSE NULL END)
            ON CONFLICT (campaign_id, contact_id) WHERE contact_id IS NOT NULL
            DO UPDATE SET
              recipient_email = EXCLUDED.recipient_email,
              delivery_channel = EXCLUDED.delivery_channel,
              delivery_address = EXCLUDED.delivery_address,
              claim_token_hash = COALESCE(EXCLUDED.claim_token_hash, campaign_recipient_invites.claim_token_hash),
              claim_expires_at = COALESCE(EXCLUDED.claim_expires_at, campaign_recipient_invites.claim_expires_at),
              status = EXCLUDED.status,
              sent_at = COALESCE(campaign_recipient_invites.sent_at, EXCLUDED.sent_at)
            RETURNING id
          `,
          [
            campaignId,
            senderTenantId,
            contactId,
            recipientEmail,
            delivery.delivery_channel,
            delivery.delivery_address,
            delivery.claim_token_hash,
            delivery.claim_expires_at,
            inviteStatus,
          ],
        );
        inviteId = upsert.rows[0]?.id ?? null;
      } else if (recipientEmail) {
        const upsert = await pool.query<{ id: string }>(
          `
            INSERT INTO campaign_recipient_invites (
              campaign_id,
              sender_tenant_id,
              recipient_email,
              delivery_channel,
              delivery_address,
              status,
              sent_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (campaign_id, recipient_email) DO UPDATE
            SET
              delivery_channel = EXCLUDED.delivery_channel,
              delivery_address = EXCLUDED.delivery_address,
              status = 'sent',
              sent_at = COALESCE(campaign_recipient_invites.sent_at, NOW())
            RETURNING id
          `,
          [
            campaignId,
            senderTenantId,
            recipientEmail,
            delivery.delivery_channel,
            delivery.delivery_address,
            inviteStatus,
          ],
        );
        inviteId = upsert.rows[0]?.id ?? null;
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01' || code === '42703') {
        return { queuedCount, skippedResolvedCount };
      }
      throw error;
    }

    if (!inviteId) {
      continue;
    }

    queuedCount += 1;
    await emitInviteAudit(pool, 'campaign_recipient_invite_queued', {
      invite_id: inviteId,
      campaign_id: campaignId,
      sender_tenant_id: senderTenantId,
      contact_id: contactId,
      recipient_email: recipientEmail,
      delivery_channel: delivery.delivery_channel,
      actor_user_id: input.actorUserId ?? null,
    });
  }

  if (queuedCount > 0) {
    await emitInviteAudit(pool, 'campaign_recipient_invites_queued', {
      campaign_id: campaignId,
      sender_tenant_id: senderTenantId,
      queued_count: queuedCount,
      skipped_resolved_count: skippedResolvedCount,
      actor_user_id: input.actorUserId ?? null,
    });
  }

  return { queuedCount, skippedResolvedCount };
}
