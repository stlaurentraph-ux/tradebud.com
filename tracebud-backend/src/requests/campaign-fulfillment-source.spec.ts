import { describe, expect, it } from '@jest/globals';

import {
  buildPhoneOnlyDecisionEmail,
  deriveFarmerAppFulfillmentSource,
  resolveCampaignFulfillmentSource,
  shouldTreatCooperativeFulfillmentAsPending,
} from './campaign-fulfillment-source';

describe('campaign-fulfillment-source', () => {
  it('derives farmer_app_phone for WhatsApp invites', () => {
    expect(
      deriveFarmerAppFulfillmentSource({
        delivery_channel: 'whatsapp',
        claimed_farmer_profile_id: 'farmer-1',
      }),
    ).toBe('farmer_app_phone');
  });

  it('classifies claimed email invites as farmer_app_email', () => {
    expect(
      resolveCampaignFulfillmentSource({
        invite: {
          contact_id: 'contact_1',
          recipient_email: 'farmer@example.com',
          delivery_channel: 'email',
          status: 'claimed',
          claimed_tenant_id: null,
          claimed_farmer_profile_id: 'farmer-1',
          sent_at: null,
        },
        decision: {
          recipient_email: 'farmer@example.com',
          decision: 'accept',
          source: 'inbox_fulfillment',
          decided_at: '2026-06-24T12:00:00.000Z',
        },
      }),
    ).toBe('farmer_app_email');
  });

  it('classifies unclaimed inbox fulfillment as cooperative_on_behalf', () => {
    expect(
      resolveCampaignFulfillmentSource({
        invite: {
          contact_id: 'contact_2',
          recipient_email: null,
          delivery_channel: 'whatsapp',
          status: 'sent',
          claimed_tenant_id: null,
          claimed_farmer_profile_id: null,
          sent_at: null,
        },
        decision: {
          recipient_email: 'phone:233241234567@campaign.local',
          decision: 'accept',
          source: 'inbox_fulfillment',
          decided_at: '2026-06-24T12:00:00.000Z',
        },
      }),
    ).toBe('cooperative_on_behalf');
  });

  it('keeps cooperative submissions pending when strict policy is enabled', () => {
    expect(
      shouldTreatCooperativeFulfillmentAsPending({
        fulfillmentSource: 'cooperative_on_behalf',
        requireFarmerAppConfirmation: true,
      }),
    ).toBe(true);
  });

  it('builds stable pseudo-email keys for phone-only decisions', () => {
    expect(buildPhoneOnlyDecisionEmail('+233 24 123 4567')).toBe(
      'phone:233241234567@campaign.local',
    );
  });
});
