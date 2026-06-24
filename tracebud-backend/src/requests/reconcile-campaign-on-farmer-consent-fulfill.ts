import { Pool } from 'pg';

import {
  deriveFarmerAppFulfillmentSource,
  resolveCampaignDecisionRecipientEmail,
} from './campaign-fulfillment-source';
import { recordCampaignFulfillmentDecision } from './record-campaign-fulfillment-decision';

export type ReconcileCampaignOnFarmerConsentFulfillResult = {
  insertedCount: number;
  campaignIds: string[];
};

type ClaimedInviteRow = {
  campaign_id: string;
  contact_id: string | null;
  recipient_email: string | null;
  delivery_address: string | null;
  delivery_channel: string | null;
  claimed_farmer_profile_id: string | null;
};

async function emitFulfillmentSourceAudit(
  pool: Pool,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      'fulfillment_source_recorded',
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
 * When a field farmer approves a consent grant, record farmer-direct campaign fulfillment
 * decisions for claimed invites from the grantee buyer tenant.
 */
export async function reconcileCampaignOnFarmerConsentFulfill(
  pool: Pool,
  input: {
    senderTenantId: string;
    farmerProfileId: string;
    consentGrantId: string;
    contactId?: string | null;
  },
): Promise<ReconcileCampaignOnFarmerConsentFulfillResult> {
  const senderTenantId = input.senderTenantId.trim();
  const farmerProfileId = input.farmerProfileId.trim();
  const contactId = input.contactId?.trim() || null;

  if (!senderTenantId || !farmerProfileId) {
    return { insertedCount: 0, campaignIds: [] };
  }

  let invites: ClaimedInviteRow[] = [];
  try {
    const res = await pool.query<ClaimedInviteRow>(
      `
        SELECT
          campaign_id,
          contact_id,
          LOWER(recipient_email) AS recipient_email,
          delivery_address,
          delivery_channel,
          claimed_farmer_profile_id
        FROM campaign_recipient_invites
        WHERE sender_tenant_id = $1
          AND claimed_farmer_profile_id = $2::uuid
          AND status = 'claimed'
          ${contactId ? 'AND (contact_id = $3 OR contact_id IS NULL)' : ''}
        ORDER BY created_at ASC
      `,
      contactId ? [senderTenantId, farmerProfileId, contactId] : [senderTenantId, farmerProfileId],
    );
    invites = res.rows;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return { insertedCount: 0, campaignIds: [] };
    }
    throw error;
  }

  const campaignIds: string[] = [];
  let insertedCount = 0;

  for (const invite of invites) {
    const fulfillmentSource = deriveFarmerAppFulfillmentSource(invite);
    const recipientEmail = resolveCampaignDecisionRecipientEmail({
      recipientEmail: invite.recipient_email,
      deliveryAddress: invite.delivery_address,
    });
    if (!recipientEmail) {
      continue;
    }

    const result = await recordCampaignFulfillmentDecision(pool, {
      campaignId: invite.campaign_id,
      senderTenantId,
      fulfillmentSource,
      decisionSource: 'consent_grant_fulfillment',
      recipientEmail,
      contactId: invite.contact_id ?? contactId,
    });

    if (!result.inserted) {
      continue;
    }

    insertedCount += 1;
    if (!campaignIds.includes(invite.campaign_id)) {
      campaignIds.push(invite.campaign_id);
    }

    await emitFulfillmentSourceAudit(pool, {
      campaign_id: invite.campaign_id,
      sender_tenant_id: senderTenantId,
      farmer_profile_id: farmerProfileId,
      consent_grant_id: input.consentGrantId,
      fulfillment_source: fulfillmentSource,
      decision_source: 'consent_grant_fulfillment',
      recipient_email: recipientEmail,
      contact_id: invite.contact_id ?? contactId,
    });
  }

  return { insertedCount, campaignIds };
}
