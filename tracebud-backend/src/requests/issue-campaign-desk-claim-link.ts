import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

import {
  buildCampaignClaimUrl,
  defaultCampaignClaimExpiresAt,
  generateCampaignClaimToken,
  hashCampaignClaimToken,
} from './campaign-claim-token';

export type IssueCampaignDeskClaimLinkResult = {
  campaignId: string;
  contactId: string;
  recipientLabel: string;
  claimUrl: string;
  claimExpiresAt: string;
};

export async function issueCampaignDeskClaimLink(
  pool: Pool,
  input: {
    tenantId: string;
    campaignId: string;
    contactId: string;
    fieldAuthBaseUrl: string;
  },
): Promise<IssueCampaignDeskClaimLinkResult> {
  const tenantId = input.tenantId.trim();
  const campaignId = input.campaignId.trim();
  const contactId = input.contactId.trim();
  if (!tenantId || !campaignId || !contactId) {
    throw new NotFoundException('Campaign desk invite not found');
  }

  const inviteRes = await pool.query<{
    id: string;
    delivery_channel: string;
    delivery_address: string | null;
    recipient_email: string | null;
  }>(
    `
      SELECT id, delivery_channel, delivery_address, recipient_email
      FROM campaign_recipient_invites
      WHERE campaign_id = $1
        AND sender_tenant_id = $2
        AND contact_id = $3
        AND delivery_channel = 'desk_only'
      LIMIT 1
    `,
    [campaignId, tenantId, contactId],
  );
  const invite = inviteRes.rows[0];
  if (!invite) {
    throw new NotFoundException('Campaign desk invite not found');
  }

  const campaignRes = await pool.query<{ tenant_id: string }>(
    `
      SELECT tenant_id
      FROM request_campaigns
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
    `,
    [campaignId, tenantId],
  );
  if (!campaignRes.rows[0]) {
    throw new ForbiddenException('Campaign not found for tenant');
  }

  const { token, tokenHash } = generateCampaignClaimToken();
  const claimExpiresAt = defaultCampaignClaimExpiresAt();
  const claimUrl = buildCampaignClaimUrl(input.fieldAuthBaseUrl, campaignId, token);

  await pool.query(
    `
      UPDATE campaign_recipient_invites
      SET
        claim_token_hash = $1,
        claim_expires_at = $2,
        status = 'sent',
        sent_at = COALESCE(sent_at, NOW())
      WHERE id = $3
    `,
    [tokenHash, claimExpiresAt, invite.id],
  );

  return {
    campaignId,
    contactId,
    recipientLabel:
      invite.delivery_address?.trim() ||
      invite.recipient_email?.trim() ||
      contactId,
    claimUrl,
    claimExpiresAt,
  };
}

export { hashCampaignClaimToken };
