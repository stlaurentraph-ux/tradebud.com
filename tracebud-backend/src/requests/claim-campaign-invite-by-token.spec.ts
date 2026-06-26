import { claimCampaignInviteByToken } from './claim-campaign-invite-by-token';
import { generateCampaignClaimToken } from './campaign-claim-token';

describe('claimCampaignInviteByToken', () => {
  it('returns not_found when token does not match any invite', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const result = await claimCampaignInviteByToken(pool as never, {
      campaignId: 'camp_1',
      token: 'missing',
      farmerProfileId: '11111111-1111-1111-1111-111111111111',
      verifiedPhoneE164: '+233241234567',
    });
    expect(result).toEqual({ claimed: false, reason: 'not_found' });
  });

  it('claims invite when token and phone match', async () => {
    const { token, tokenHash } = generateCampaignClaimToken();
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              invite_id: 'invite-1',
              campaign_id: 'camp_1',
              sender_tenant_id: 'tenant_a',
              contact_id: 'contact_1',
              delivery_channel: 'whatsapp',
              delivery_address: '+233241234567',
              claim_token_hash: tokenHash,
              claim_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
              claimed_farmer_profile_id: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'invite-1' }] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 }),
    };

    const result = await claimCampaignInviteByToken(pool as never, {
      campaignId: 'camp_1',
      token,
      farmerProfileId: '11111111-1111-1111-1111-111111111111',
      verifiedPhoneE164: '+233241234567',
      actorUserId: 'user-1',
    });

    expect(result).toEqual({
      claimed: true,
      campaignId: 'camp_1',
      contactId: 'contact_1',
      senderTenantId: 'tenant_a',
    });
  });

  it('rejects when verified phone does not match invite delivery address', async () => {
    const { token, tokenHash } = generateCampaignClaimToken();
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [
          {
            invite_id: 'invite-1',
            campaign_id: 'camp_1',
            sender_tenant_id: 'tenant_a',
            contact_id: 'contact_1',
            delivery_channel: 'whatsapp',
            delivery_address: '+233241234567',
            claim_token_hash: tokenHash,
            claim_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
            claimed_farmer_profile_id: null,
          },
        ],
      }),
    };

    const result = await claimCampaignInviteByToken(pool as never, {
      campaignId: 'camp_1',
      token,
      farmerProfileId: '11111111-1111-1111-1111-111111111111',
      verifiedPhoneE164: '+233999999999',
    });

    expect(result).toEqual({ claimed: false, reason: 'phone_mismatch' });
  });
});
