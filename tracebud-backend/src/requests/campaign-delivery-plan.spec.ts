import {
  countDeliverableRecipients,
  legacyEmailDeliveryRecipients,
  planCampaignDeliveries,
} from './campaign-delivery-plan';

describe('campaign-delivery-plan', () => {
  it('plans email delivery when CRM contact has email', () => {
    expect(
      planCampaignDeliveries([
        { id: 'contact_1', full_name: 'Alice', email: 'alice@example.com', phone: '+233000' },
      ]),
    ).toEqual([
      {
        contact_id: 'contact_1',
        full_name: 'Alice',
        email: 'alice@example.com',
        phone: '+233000',
        delivery_channel: 'email',
        delivery_address: 'alice@example.com',
      },
    ]);
  });

  it('plans WhatsApp delivery when CRM contact has phone but no email', () => {
    expect(
      planCampaignDeliveries([
        { id: 'contact_2', full_name: 'Bob', email: null, phone: '+233111222' },
      ]),
    ).toEqual([
      {
        contact_id: 'contact_2',
        full_name: 'Bob',
        email: null,
        phone: '+233111222',
        delivery_channel: 'whatsapp',
        delivery_address: '+233111222',
      },
    ]);
  });

  it('counts deliverable email, WhatsApp, and desk-only recipients', () => {
    const deliveries = [
      ...planCampaignDeliveries([
        { id: 'c1', full_name: 'A', email: 'a@example.com', phone: null },
        { id: 'c2', full_name: 'B', email: null, phone: '+2331' },
      ]),
      ...legacyEmailDeliveryRecipients(['legacy@example.com']),
    ];

    expect(countDeliverableRecipients(deliveries)).toEqual({
      total: 3,
      email: 2,
      whatsapp: 1,
      desk_only: 0,
    });
  });
});
