import { describe, expect, it, jest } from '@jest/globals';

import { reconcileCampaignOnFarmerConsentFulfill } from './reconcile-campaign-on-farmer-consent-fulfill';

describe('reconcileCampaignOnFarmerConsentFulfill', () => {
  it('records farmer_app_phone fulfillment for claimed WhatsApp invites', async () => {
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM campaign_recipient_invites')) {
        return {
          rows: [
            {
              campaign_id: 'camp_1',
              contact_id: 'contact_1',
              recipient_email: null,
              delivery_address: '+233241234567',
              delivery_channel: 'whatsapp',
              claimed_farmer_profile_id: 'farmer_1',
            },
          ],
        };
      }

      if (normalized.includes('INSERT INTO request_campaign_recipient_decisions')) {
        return { rows: [{ campaign_id: 'camp_1' }] };
      }

      return { rows: [] };
    });

    const pool = { query };
    const result = await reconcileCampaignOnFarmerConsentFulfill(pool as any, {
      senderTenantId: 'tenant_buyer',
      farmerProfileId: 'farmer_1',
      consentGrantId: 'grant_1',
      contactId: 'contact_1',
    });

    expect(result).toEqual({ insertedCount: 1, campaignIds: ['camp_1'] });
    expect(
      query.mock.calls.some(([sql, params]) =>
        sql.includes('request_campaign_recipient_decisions') &&
        Array.isArray(params) &&
        params[1] === 'phone:233241234567@campaign.local' &&
        params[3] === 'farmer_app_phone' &&
        params[4] === 'contact_1',
      ),
    ).toBe(true);
  });
});
