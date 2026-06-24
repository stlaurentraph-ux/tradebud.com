import { Pool } from 'pg';

export type ClaimCampaignInvitesForFieldFarmerResult = {
  claimedCount: number;
  campaignIds: string[];
  senderTenantIds: string[];
};

type PendingInviteRow = {
  invite_id: string;
  campaign_id: string;
  sender_tenant_id: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
 * When a field farmer signs in and bootstraps, claim pending campaign invites by email
 * and link sender CRM farmer contacts to this producer profile.
 */
export async function claimCampaignInvitesForFieldFarmer(
  pool: Pool,
  input: {
    recipientEmail: string;
    farmerProfileId: string;
    actorUserId?: string | null;
    campaignId?: string | null;
  },
): Promise<ClaimCampaignInvitesForFieldFarmerResult> {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const farmerProfileId = input.farmerProfileId.trim();
  const prioritizedCampaignId = input.campaignId?.trim() || null;

  if (!recipientEmail || !farmerProfileId) {
    return { claimedCount: 0, campaignIds: [], senderTenantIds: [] };
  }

  let rows: PendingInviteRow[] = [];
  try {
    const res = await pool.query<PendingInviteRow>(
      `
        SELECT
          id AS invite_id,
          campaign_id,
          sender_tenant_id
        FROM campaign_recipient_invites
        WHERE lower(recipient_email) = $1
          AND status IN ('pending', 'sent')
          AND claimed_tenant_id IS NULL
          AND claimed_farmer_profile_id IS NULL
        ORDER BY
          CASE WHEN $2::text IS NOT NULL AND campaign_id = $2 THEN 0 ELSE 1 END,
          created_at ASC
      `,
      [recipientEmail, prioritizedCampaignId],
    );
    rows = res.rows;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return { claimedCount: 0, campaignIds: [], senderTenantIds: [] };
    }
    throw error;
  }

  const campaignIds: string[] = [];
  const senderTenantIds: string[] = [];
  let claimedCount = 0;

  for (const invite of rows) {
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
      continue;
    }

    claimedCount += 1;
    if (!campaignIds.includes(invite.campaign_id)) {
      campaignIds.push(invite.campaign_id);
    }
    if (!senderTenantIds.includes(invite.sender_tenant_id)) {
      senderTenantIds.push(invite.sender_tenant_id);
    }

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
            AND lower(email) = $3
            AND contact_type = 'farmer'
        `,
        [farmerProfileId, invite.sender_tenant_id, recipientEmail],
      );
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== '42P01' && code !== '42703') {
        throw error;
      }
    }

    await emitAudit(pool, 'campaign_recipient_field_farmer_claimed', {
      invite_id: invite.invite_id,
      campaign_id: invite.campaign_id,
      sender_tenant_id: invite.sender_tenant_id,
      recipient_email: recipientEmail,
      farmer_profile_id: farmerProfileId,
      actor_user_id: input.actorUserId ?? null,
    });
  }

  if (claimedCount > 0) {
    await emitAudit(pool, 'campaign_field_farmer_invites_claimed', {
      recipient_email: recipientEmail,
      farmer_profile_id: farmerProfileId,
      campaign_ids: campaignIds,
      sender_tenant_ids: senderTenantIds,
      claimed_count: claimedCount,
    });
  }

  return { claimedCount, campaignIds, senderTenantIds };
}
