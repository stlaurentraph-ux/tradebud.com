import { Pool } from 'pg';
import type { InboxService } from '../inbox/inbox.service';
import { claimSupplierContactsOnSignup } from '../contacts/claim-supplier-contacts-on-signup';
import { claimPendingDeliveryBuyerInvitesOnSignup } from '../harvest/claim-delivery-buyer-invites-on-signup';
import { claimPendingCampaignRecipientInvitesOnSignup } from '../requests/claim-campaign-recipient-invites-on-signup';

export type LinkPendingNetworkInvitesOnSignupResult = {
  deliveryBuyerClaimedCount: number;
  campaignRecipientClaimedCount: number;
  campaignInboxRequestsCreated: number;
  supplierContactsEngaged: number;
};

/**
 * Post-signup orchestrator for delivery buyer, campaign recipient, and CRM supplier claims.
 */
export async function linkPendingNetworkInvitesOnSignup(
  pool: Pool,
  inboxService: InboxService,
  input: {
    recipientEmail: string;
    tenantId: string;
    actorUserId?: string | null;
    granteeOrgName?: string | null;
  },
): Promise<LinkPendingNetworkInvitesOnSignupResult> {
  const delivery = await claimPendingDeliveryBuyerInvitesOnSignup(pool, {
    recipientEmail: input.recipientEmail,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId ?? null,
    granteeOrgName: input.granteeOrgName ?? null,
  }).catch(() => ({ claimedCount: 0, voucherIds: [] as string[] }));

  const campaign = await claimPendingCampaignRecipientInvitesOnSignup(pool, inboxService, {
    recipientEmail: input.recipientEmail,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId ?? null,
  }).catch(() => ({ claimedCount: 0, inboxRequestsCreated: 0 }));

  const supplierContacts = await claimSupplierContactsOnSignup(pool, {
    recipientEmail: input.recipientEmail,
    recipientTenantId: input.tenantId,
    actorUserId: input.actorUserId ?? null,
  }).catch(() => ({ updatedCount: 0 }));

  await inboxService
    .backfillInboxForSignupContact({
      email: input.recipientEmail,
      recipientTenantId: input.tenantId,
    })
    .catch(() => undefined);

  return {
    deliveryBuyerClaimedCount: delivery.claimedCount,
    campaignRecipientClaimedCount: campaign.claimedCount,
    campaignInboxRequestsCreated: campaign.inboxRequestsCreated,
    supplierContactsEngaged: supplierContacts.updatedCount,
  };
}
