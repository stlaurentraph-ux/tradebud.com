import { Pool } from 'pg';
import type { InboxService } from '../inbox/inbox.service';

export type ClaimPendingCampaignRecipientInvitesOnSignupResult = {
  claimedCount: number;
  inboxRequestsCreated: number;
};

type PendingInviteRow = {
  invite_id: string;
  campaign_id: string;
  sender_tenant_id: string;
  recipient_email: string;
  claimed_tenant_id: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function emitClaimAudit(
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

async function listPendingInvites(
  pool: Pool,
  recipientEmail: string,
): Promise<PendingInviteRow[]> {
  try {
    const res = await pool.query<PendingInviteRow>(
      `
        SELECT
          id AS invite_id,
          campaign_id,
          sender_tenant_id,
          recipient_email,
          claimed_tenant_id
        FROM campaign_recipient_invites
        WHERE lower(recipient_email) = $1
          AND status IN ('pending', 'sent')
          AND claimed_tenant_id IS NULL
        ORDER BY created_at ASC
      `,
      [recipientEmail],
    );
    return res.rows;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return [];
    }
    throw error;
  }
}

/**
 * When a dashboard user signs up with an email that received a campaign outreach message,
 * claim pending invites and ensure inbox request rows exist.
 */
export async function claimPendingCampaignRecipientInvitesOnSignup(
  pool: Pool,
  inboxService: InboxService,
  input: {
    recipientEmail: string;
    tenantId: string;
    actorUserId?: string | null;
  },
): Promise<ClaimPendingCampaignRecipientInvitesOnSignupResult> {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const tenantId = input.tenantId.trim();
  if (!recipientEmail || !tenantId) {
    return { claimedCount: 0, inboxRequestsCreated: 0 };
  }

  const pending = await listPendingInvites(pool, recipientEmail);
  let claimedCount = 0;
  let inboxRequestsCreated = 0;

  for (const invite of pending) {
    if (invite.sender_tenant_id === tenantId) {
      await emitClaimAudit(pool, 'campaign_recipient_invite_claim_skipped', {
        invite_id: invite.invite_id,
        campaign_id: invite.campaign_id,
        recipient_email: recipientEmail,
        tenant_id: tenantId,
        reason: 'sender_tenant_matches_recipient',
      });
      continue;
    }

    const claimUpdate = await pool.query<{ id: string }>(
      `
        UPDATE campaign_recipient_invites
        SET
          status = 'claimed',
          claimed_tenant_id = $1
        WHERE id = $2
          AND status IN ('pending', 'sent')
          AND claimed_tenant_id IS NULL
        RETURNING id
      `,
      [tenantId, invite.invite_id],
    );

    if ((claimUpdate.rowCount ?? 0) === 0) {
      continue;
    }

    claimedCount += 1;

    const inboxResult = await inboxService.ensureInboxForCampaignRecipient({
      campaignId: invite.campaign_id,
      recipientTenantId: tenantId,
    });
    if (inboxResult.created) {
      inboxRequestsCreated += 1;
    }

    await emitClaimAudit(pool, 'campaign_recipient_invite_claimed', {
      invite_id: invite.invite_id,
      campaign_id: invite.campaign_id,
      sender_tenant_id: invite.sender_tenant_id,
      recipient_email: recipientEmail,
      tenant_id: tenantId,
      inbox_created: inboxResult.created,
      actor_user_id: input.actorUserId ?? null,
    });
  }

  return { claimedCount, inboxRequestsCreated };
}
