import { claimCampaignInvitesForFieldFarmer } from './claim-campaign-invites-for-field-farmer';

describe('claimCampaignInvitesForFieldFarmer', () => {
  it('returns empty when email or farmer id is missing', async () => {
    const pool = { query: jest.fn() };
    const result = await claimCampaignInvitesForFieldFarmer(pool as never, {
      recipientEmail: ' ',
      farmerProfileId: 'farmer-uuid',
    });
    expect(result.claimedCount).toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('claims invites and links CRM farmer contacts', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              invite_id: 'invite-1',
              campaign_id: 'campaign_1',
              sender_tenant_id: 'tenant_exporter',
            },
          ],
        })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'invite-1' }] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValue({ rowCount: 1, rows: [] }),
    };

    const result = await claimCampaignInvitesForFieldFarmer(pool as never, {
      recipientEmail: 'farmer@example.com',
      farmerProfileId: '11111111-1111-1111-1111-111111111111',
      actorUserId: 'user-1',
      campaignId: 'campaign_1',
    });

    expect(result).toEqual({
      claimedCount: 1,
      campaignIds: ['campaign_1'],
      senderTenantIds: ['tenant_exporter'],
    });
    expect(
      (pool.query as jest.Mock).mock.calls.some(
        (call) => call[1]?.[0] === 'campaign_recipient_field_farmer_claimed',
      ),
    ).toBe(true);
  });
});
