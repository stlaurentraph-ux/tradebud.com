export type SmsCampaignDeliveryResult = {
  sent: boolean;
  messageId: string | null;
  skippedReason: string | null;
};

type SmsTemplatePayload = {
  toPhoneE164: string;
  campaignTitle: string;
  fromOrg: string;
  claimUrl: string;
};

function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_CAMPAIGN_SMS_FROM?.trim(),
  );
}

function normalizeSmsPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  return `+${trimmed.replace(/[^\d]/g, '')}`;
}

export async function sendCampaignSmsInvite(
  input: SmsTemplatePayload,
): Promise<SmsCampaignDeliveryResult> {
  if (!isSmsConfigured()) {
    return {
      sent: false,
      messageId: null,
      skippedReason: 'sms_not_configured',
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? '';
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? '';
  const from = process.env.TWILIO_CAMPAIGN_SMS_FROM?.trim() ?? '';
  const to = normalizeSmsPhone(input.toPhoneE164);
  const body = `${input.fromOrg} invited you to complete "${input.campaignTitle}" on Tracebud: ${input.claimUrl}`;

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    sid?: string;
    message?: string;
  };

  if (!response.ok) {
    return {
      sent: false,
      messageId: null,
      skippedReason: payload.message ?? `sms_http_${response.status}`,
    };
  }

  return {
    sent: true,
    messageId: payload.sid ?? null,
    skippedReason: null,
  };
}
