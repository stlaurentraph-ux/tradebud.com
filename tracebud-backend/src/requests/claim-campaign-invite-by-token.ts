import { Pool } from 'pg';

import { normalizeFarmerPhoneE164 } from '../contacts/crm-contact-reachability';
import { verifyCampaignClaimToken } from './campaign-claim-token';

export type ClaimCampaignInviteByTokenResult =
  | { claimed: true; campaignId: string; contactId: string; senderTenantId: string }
  | {
      claimed: false;
      reason: 'not_found' | 'expired' | 'phone_mismatch' | 'already_claimed' | 'invalid_channel';
    };

type PendingInviteRow = {
  invite_id: string;
  campaign_id: string;
  sender_tenant_id: string;
  contact_id: string | null;
  delivery_channel: string;
  delivery_address: string | null;
  claim_token_hash: string | null;
  claim_expires_at: string | null;
  claimed_farmer_profile_id: string | null;
};

async function emitAudit(
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

/**
 * Claim a WhatsApp/SMS campaign invite using the opaque token from the invite URL.
 * Requires the signed-in farmer's verified phone to match the invite delivery address.
 */
export async function claimCampaignInviteByToken(
  pool: Pool,
  input: {
    campaignId: string;
    token: string;
    farmerProfileId: string;
    verifiedPhoneE164: string;
    actorUserId?: string | null;
  },
): Promise<ClaimCampaignInviteByTokenResult> {
  const campaignId = input.campaignId.trim();
  const token = input.token.trim();
  const farmerProfileId = input.farmerProfileId.trim();
  const verifiedPhone = normalizeFarmerPhoneE164(input.verifiedPhoneE164);

  if (!campaignId || !token || !farmerProfileId || !verifiedPhone) {
    return { claimed: false, reason: 'not_found' };
  }

  let invite: PendingInviteRow | undefined;
  try {
    const res = await pool.query<PendingInviteRow>(
      `
        SELECT
          id AS invite_id,
          campaign_id,
          sender_tenant_id,
          contact_id,
          delivery_channel,
          delivery_address,
          claim_token_hash,
          claim_expires_at,
          claimed_farmer_profile_id
        FROM campaign_recipient_invites
        WHERE campaign_id = $1
          AND status IN ('pending', 'sent')
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [campaignId],
    );
    invite = res.rows.find(
      (row) => row.claim_token_hash && verifyCampaignClaimToken(token, row.claim_token_hash),
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return { claimed: false, reason: 'not_found' };
    }
    throw error;
  }

  if (!invite?.claim_token_hash) {
    return { claimed: false, reason: 'not_found' };
  }

  if (invite.claimed_farmer_profile_id) {
    return { claimed: false, reason: 'already_claimed' };
  }

  if (invite.claim_expires_at && new Date(invite.claim_expires_at).getTime() < Date.now()) {
    return { claimed: false, reason: 'expired' };
  }

  if (invite.delivery_channel !== 'whatsapp' && invite.delivery_channel !== 'sms') {
    return { claimed: false, reason: 'invalid_channel' };
  }

  const invitePhone = normalizeFarmerPhoneE164(invite.delivery_address);
  if (!invitePhone || invitePhone !== verifiedPhone) {
    return { claimed: false, reason: 'phone_mismatch' };
  }

  const claimUpdate = await pool.query<{ id: string }>(
    `
      UPDATE campaign_recipient_invites
      SET
        status = 'claimed',
        claimed_farmer_profile_id = $1::uuid
      WHERE id = $2
        AND status IN ('pending', 'sent')
        AND claimed_farmer_profile_id IS NULL
      RETURNING id
    `,
    [farmerProfileId, invite.invite_id],
  );

  if ((claimUpdate.rowCount ?? 0) === 0) {
    return { claimed: false, reason: 'already_claimed' };
  }

  if (invite.contact_id) {
    try {
      await pool.query(
        `
          UPDATE crm_contacts
          SET
            farmer_profile_id = $1::uuid,
            status = 'engaged',
            last_activity_at = NOW(),
            updated_at = NOW()
          WHERE tenant_id = $2
            AND id = $3
            AND contact_type = 'farmer'
        `,
        [farmerProfileId, invite.sender_tenant_id, invite.contact_id],
      );
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01' && code !== '42703') {
        throw error;
      }
    }
  }

  await emitAudit(pool, 'campaign_recipient_field_farmer_claimed', {
    invite_id: invite.invite_id,
    campaign_id: invite.campaign_id,
    sender_tenant_id: invite.sender_tenant_id,
    contact_id: invite.contact_id,
    delivery_channel: invite.delivery_channel,
    delivery_address: invite.delivery_address,
    farmer_profile_id: farmerProfileId,
    actor_user_id: input.actorUserId ?? null,
    claim_path: 'token_phone',
  });

  await emitAudit(pool, 'campaign_invite_claimed_by_token', {
    campaign_id: invite.campaign_id,
    contact_id: invite.contact_id,
    farmer_profile_id: farmerProfileId,
    delivery_channel: invite.delivery_channel,
    actor_user_id: input.actorUserId ?? null,
  });

  return {
    claimed: true,
    campaignId: invite.campaign_id,
    contactId: invite.contact_id ?? '',
    senderTenantId: invite.sender_tenant_id,
  };
}
