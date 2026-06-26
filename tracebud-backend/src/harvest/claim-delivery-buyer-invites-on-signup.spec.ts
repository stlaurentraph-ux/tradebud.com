import { Pool } from 'pg';
import { claimPendingDeliveryBuyerInvitesOnSignup } from './claim-delivery-buyer-invites-on-signup';

describe('claim-delivery-buyer-invites-on-signup', () => {
  it('claims pending invites, sets voucher tenant, and emits audit', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              invite_id: 'invite-1',
              voucher_id: 'voucher-1',
              farmer_id: 'farmer-1',
              invite_status: 'sent',
              intended_recipient_tenant_id: null,
              intended_recipient_email: 'buyer@coop.example',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'grant-1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'voucher-1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 }),
    } as unknown as Pool;

    const result = await claimPendingDeliveryBuyerInvitesOnSignup(pool, {
      recipientEmail: 'buyer@coop.example',
      tenantId: 'tenant_buyer',
      actorUserId: 'user-1',
      granteeOrgName: 'Buyer Coop',
    });

    expect(result).toEqual({ claimedCount: 1, voucherIds: ['voucher-1'] });
    expect((pool.query as jest.Mock).mock.calls.some((call) => call[1]?.[0] === 'tenant_buyer')).toBe(
      true,
    );
    expect(
      (pool.query as jest.Mock).mock.calls.some(
        (call) => call[1]?.[0] === 'delivery_buyer_invite_claimed',
      ),
    ).toBe(true);
  });

  it('returns empty result when email or tenant is missing', async () => {
    const pool = { query: jest.fn() } as unknown as Pool;

    await expect(
      claimPendingDeliveryBuyerInvitesOnSignup(pool, {
        recipientEmail: '  ',
        tenantId: 'tenant_buyer',
      }),
    ).resolves.toEqual({ claimedCount: 0, voucherIds: [] });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
