import {
  buildCampaignRecipientShareLinks,
  canResendCampaignRecipientInvite,
  enrichCampaignRecipientForSender,
} from './campaign-recipient-sender-actions';

describe('campaign-recipient-sender-actions', () => {
  it('builds dashboard share links for supplier recipients', () => {
    const links = buildCampaignRecipientShareLinks({
      campaignId: 'camp_1',
      isFarmerRecipient: false,
      dashboardBaseUrl: 'https://dashboard.tracebud.com',
      fieldAuthBaseUrl: 'https://app.tracebud.com',
    });
    expect(links.recipient_lane).toBe('dashboard');
    expect(links.connect_url).toContain('/create-account?campaign=camp_1');
    expect(links.inbox_url).toContain('/inbox?campaign=camp_1');
  });

  it('allows resend for invite_sent on running campaigns', () => {
    expect(
      canResendCampaignRecipientInvite({
        onboardingStatus: 'invite_sent',
        campaignStatus: 'RUNNING',
        recipientEmail: 'supplier@example.com',
        deliveryChannel: 'email',
      }),
    ).toBe(true);
  });

  it('blocks resend for fulfilled recipients', () => {
    expect(
      canResendCampaignRecipientInvite({
        onboardingStatus: 'fulfilled',
        campaignStatus: 'RUNNING',
        recipientEmail: 'supplier@example.com',
        deliveryChannel: 'email',
      }),
    ).toBe(false);
  });

  it('enriches timeline entries with share links and resend flag', () => {
    const enriched = enrichCampaignRecipientForSender(
      {
        contact_id: null,
        recipient_email: 'supplier@example.com',
        recipient_label: 'Supplier',
        delivery_channel: 'email',
        onboarding_status: 'invite_sent',
        invite_status: 'queued',
        decision: null,
        decision_source: null,
        fulfillment_source: null,
        decided_at: null,
        updated_at: null,
      },
      {
        campaignId: 'camp_1',
        campaignStatus: 'RUNNING',
        dashboardBaseUrl: 'https://dashboard.tracebud.com',
        fieldAuthBaseUrl: 'https://app.tracebud.com',
        isFarmerRecipient: false,
      },
    );
    expect(enriched.share_links?.connect_url).toContain('create-account');
    expect(enriched.can_resend_invite).toBe(true);
  });
});
