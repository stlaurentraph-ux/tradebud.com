import { claimPendingCampaignRecipientInvitesOnSignup } from './claim-campaign-recipient-invites-on-signup';
import type { InboxService } from '../inbox/inbox.service';

describe('claimPendingCampaignRecipientInvitesOnSignup', () => {
  it('claims pending invites and ensures inbox rows', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{
            invite_id: 'invite-1',
            campaign_id: 'campaign_1',
            sender_tenant_id: 'tenant_exporter',
            recipient_email: 'supplier@coop.org',
            claimed_tenant_id: null,
          }],
        })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'invite-1' }] })
        .mockResolvedValue({ rowCount: 1, rows: [] }),
    };

    const inboxService = {
      ensureInboxForCampaignRecipient: jest.fn().mockResolvedValue({ created: true }),
    } as unknown as InboxService;

    const result = await claimPendingCampaignRecipientInvitesOnSignup(pool as never, inboxService, {
      recipientEmail: 'supplier@coop.org',
      tenantId: 'tenant_supplier',
    });

    expect(result.claimedCount).toBe(1);
    expect(result.inboxRequestsCreated).toBe(1);
  });
});
