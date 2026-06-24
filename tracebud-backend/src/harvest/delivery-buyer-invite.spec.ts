import { Pool } from 'pg';
import { queueDeliveryBuyerInvite } from './delivery-buyer-invite';

describe('delivery-buyer-invite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('queues invite and skips send when Resend is not configured', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    const result = await queueDeliveryBuyerInvite(pool, {
      voucherId: 'voucher-1',
      farmerId: 'farmer-1',
      recipientEmail: 'buyer@example.com',
    });

    expect(result).toEqual({
      email: 'buyer@example.com',
      pending: true,
      inviteSent: false,
    });
    expect(
      (pool.query as jest.Mock).mock.calls.some(
        (call) => call[1]?.[0] === 'delivery_buyer_invite_send_skipped',
      ),
    ).toBe(true);
  });
});
