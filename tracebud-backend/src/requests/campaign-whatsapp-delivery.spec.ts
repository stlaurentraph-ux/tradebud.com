import { sendCampaignWhatsAppInvite } from './campaign-whatsapp-delivery';

describe('sendCampaignWhatsAppInvite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_CAMPAIGN_TEMPLATE_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('skips when WhatsApp is not configured', async () => {
    await expect(
      sendCampaignWhatsAppInvite({
        toPhoneE164: '+233241234567',
        campaignTitle: 'Harvest evidence',
        fromOrg: 'North Valley Cooperative',
        claimUrl: 'https://auth.tracebud.com/campaign?campaign=c1&token=abc',
      }),
    ).resolves.toEqual({
      sent: false,
      messageId: null,
      skippedReason: 'whatsapp_not_configured',
    });
  });
});
