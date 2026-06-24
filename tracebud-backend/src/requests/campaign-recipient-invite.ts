import { Pool } from 'pg';

export type QueueCampaignRecipientInvitesResult = {
  queuedCount: number;
  skippedResolvedCount: number;
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

/**
 * After a campaign send, persist invite rows for recipients whose email does not resolve to a workspace tenant.
 */
export async function queueCampaignRecipientInvites(
  pool: Pool,
  input: {
    campaignId: string;
    senderTenantId: string;
    recipientEmails: readonly string[];
    actorUserId?: string | null;
  },
): Promise<QueueCampaignRecipientInvitesResult> {
  const campaignId = input.campaignId.trim();
  const senderTenantId = input.senderTenantId.trim();
  const emails = Array.from(
    new Set(
      input.recipientEmails
        .map((email) => normalizeEmail(email))
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  );

  if (!campaignId || !senderTenantId || emails.length === 0) {
    return { queuedCount: 0, skippedResolvedCount: 0 };
  }

  const tenantByEmail = await resolveTenantIdsByEmail(pool, emails);
  let queuedCount = 0;
  let skippedResolvedCount = 0;

  for (const recipientEmail of emails) {
    const resolvedTenantId = tenantByEmail.get(recipientEmail);
    if (resolvedTenantId) {
      skippedResolvedCount += 1;
      continue;
    }

    let inviteId: string | null = null;
    try {
      const upsert = await pool.query<{ id: string }>(
        `
          INSERT INTO campaign_recipient_invites (
            campaign_id,
            sender_tenant_id,
            recipient_email,
            status,
            sent_at
          )
          VALUES ($1, $2, $3, 'sent', NOW())
          ON CONFLICT (campaign_id, recipient_email) DO UPDATE
          SET
            status = 'sent',
            sent_at = COALESCE(campaign_recipient_invites.sent_at, NOW())
          RETURNING id
        `,
        [campaignId, senderTenantId, recipientEmail],
      );
      inviteId = upsert.rows[0]?.id ?? null;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
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
      recipient_email: recipientEmail,
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
