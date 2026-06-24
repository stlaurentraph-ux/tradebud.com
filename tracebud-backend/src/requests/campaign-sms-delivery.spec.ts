import { describe, expect, it } from '@jest/globals';

import { sendCampaignSmsInvite } from './campaign-sms-delivery';

describe('campaign-sms-delivery', () => {
  it('skips when Twilio env is not configured', async () => {
    const originalSid = process.env.TWILIO_ACCOUNT_SID;
    const originalToken = process.env.TWILIO_AUTH_TOKEN;
    const originalFrom = process.env.TWILIO_CAMPAIGN_SMS_FROM;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_CAMPAIGN_SMS_FROM;

    await expect(
      sendCampaignSmsInvite({
        toPhoneE164: '+233241234567',
        campaignTitle: 'Plot geometry',
        fromOrg: 'Buyer Org',
        claimUrl: 'https://auth.tracebud.com/campaign?campaign=c1&token=t1',
      }),
    ).resolves.toEqual({
      sent: false,
      messageId: null,
      skippedReason: 'sms_not_configured',
    });

    process.env.TWILIO_ACCOUNT_SID = originalSid;
    process.env.TWILIO_AUTH_TOKEN = originalToken;
    process.env.TWILIO_CAMPAIGN_SMS_FROM = originalFrom;
  });
});
