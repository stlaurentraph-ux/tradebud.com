import { Pool } from 'pg';

import type { CampaignFulfillmentDecisionSource, CampaignFulfillmentSource } from './campaign-fulfillment-source';
import { resolveCampaignDecisionRecipientEmail } from './campaign-fulfillment-source';

export type RecordCampaignFulfillmentDecisionResult = {
  inserted: boolean;
  recipientEmail: string | null;
};

export async function recordCampaignFulfillmentDecision(
  pool: Pool,
  input: {
    campaignId: string;
    senderTenantId: string;
    fulfillmentSource: CampaignFulfillmentSource;
    decisionSource: CampaignFulfillmentDecisionSource;
    recipientEmail?: string | null;
    deliveryAddress?: string | null;
    contactId?: string | null;
  },
): Promise<RecordCampaignFulfillmentDecisionResult> {
  const campaignId = input.campaignId.trim();
  const senderTenantId = input.senderTenantId.trim();
  const recipientEmail = resolveCampaignDecisionRecipientEmail({
    recipientEmail: input.recipientEmail,
    deliveryAddress: input.deliveryAddress,
  });
  const contactId = input.contactId?.trim() || null;

  if (!campaignId || !senderTenantId || !recipientEmail) {
    return { inserted: false, recipientEmail: null };
  }

  let inserted = false;
  try {
    const decisionRes = await pool.query<{ campaign_id: string }>(
      `
        INSERT INTO request_campaign_recipient_decisions (
          campaign_id,
          recipient_email,
          decision,
          source,
          fulfillment_source,
          contact_id
        )
        VALUES ($1, $2, 'accept', $3, $4, $5)
        ON CONFLICT (campaign_id, recipient_email) DO NOTHING
        RETURNING campaign_id
      `,
      [
        campaignId,
        recipientEmail,
        input.decisionSource,
        input.fulfillmentSource,
        contactId,
      ],
    );
    inserted = Boolean(decisionRes.rows[0]?.campaign_id);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return { inserted: false, recipientEmail };
    }
    throw error;
  }

  if (!inserted) {
    return { inserted: false, recipientEmail };
  }

  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      'fulfillment_source_recorded',
      JSON.stringify({
        campaign_id: campaignId,
        sender_tenant_id: senderTenantId,
        recipient_email: recipientEmail,
        fulfillment_source: input.fulfillmentSource,
        decision_source: input.decisionSource,
        contact_id: contactId,
      }),
    ]);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }

  try {
    await pool.query(
      `
        UPDATE request_campaigns
        SET
          accepted_count = accepted_count + 1,
          pending_count = CASE WHEN pending_count > 0 THEN pending_count - 1 ELSE pending_count END,
          status = CASE
            WHEN status IN ('RUNNING', 'PARTIAL') AND pending_count <= 1 THEN
              CASE
                WHEN expired_count > 0 THEN 'PARTIAL'
                ELSE 'COMPLETED'
              END
            ELSE status
          END,
          updated_at = NOW()
        WHERE tenant_id = $1
          AND id = $2
          AND status IN ('RUNNING', 'PARTIAL')
      `,
      [senderTenantId, campaignId],
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01' && code !== '42703') {
      throw error;
    }
  }

  return { inserted: true, recipientEmail };
}
