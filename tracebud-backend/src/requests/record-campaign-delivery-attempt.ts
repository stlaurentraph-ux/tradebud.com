import { Pool } from 'pg';

export type CampaignDeliveryAttemptChannel = 'email' | 'whatsapp' | 'sms' | 'desk_only';
export type CampaignDeliveryAttemptStatus = 'sent' | 'skipped' | 'failed' | 'queued';

export type RecordCampaignDeliveryAttemptInput = {
  campaignId: string;
  senderTenantId: string;
  contactId?: string | null;
  inviteId?: string | null;
  deliveryChannel: CampaignDeliveryAttemptChannel;
  deliveryAddress?: string | null;
  status: CampaignDeliveryAttemptStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  skipReason?: string | null;
  claimTokenHash?: string | null;
};

export async function recordCampaignDeliveryAttempt(
  pool: Pool,
  input: RecordCampaignDeliveryAttemptInput,
): Promise<void> {
  const campaignId = input.campaignId.trim();
  const senderTenantId = input.senderTenantId.trim();
  if (!campaignId || !senderTenantId) {
    return;
  }

  try {
    await pool.query(
      `
        INSERT INTO campaign_delivery_attempts (
          campaign_id,
          sender_tenant_id,
          invite_id,
          contact_id,
          delivery_channel,
          delivery_address,
          status,
          provider,
          provider_message_id,
          skip_reason,
          claim_token_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        campaignId,
        senderTenantId,
        input.inviteId?.trim() || null,
        input.contactId?.trim() || null,
        input.deliveryChannel,
        input.deliveryAddress?.trim() || null,
        input.status,
        input.provider?.trim() || null,
        input.providerMessageId?.trim() || null,
        input.skipReason?.trim() || null,
        input.claimTokenHash?.trim() || null,
      ],
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return;
    }
    throw error;
  }

  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      'campaign_delivery_sent',
      JSON.stringify({
        campaign_id: campaignId,
        sender_tenant_id: senderTenantId,
        contact_id: input.contactId ?? null,
        delivery_channel: input.deliveryChannel,
        status: input.status,
        provider: input.provider ?? null,
        skip_reason: input.skipReason ?? null,
      }),
    ]);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }
}
