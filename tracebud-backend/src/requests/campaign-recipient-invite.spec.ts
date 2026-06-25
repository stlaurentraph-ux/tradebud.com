import { Pool } from 'pg';
import { queueCampaignRecipientInvites } from './campaign-recipient-invite';

describe('queueCampaignRecipientInvites', () => {
  it('queues invite rows when email does not resolve to a tenant', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'invite-1' }] })
        .mockResolvedValue({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    const result = await queueCampaignRecipientInvites(pool, {
      campaignId: 'campaign_1',
      senderTenantId: 'tenant_exporter',
      recipientEmails: ['new@coop.org'],
    });

    expect(result.queuedCount).toBe(1);
  });
});
