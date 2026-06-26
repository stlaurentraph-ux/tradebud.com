export type WhatsAppCampaignDeliveryResult = {
  sent: boolean;
  messageId: string | null;
  skippedReason: string | null;
};

type WhatsAppTemplatePayload = {
  toPhoneE164: string;
  campaignTitle: string;
  fromOrg: string;
  claimUrl: string;
};

function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
      process.env.WHATSAPP_CAMPAIGN_TEMPLATE_NAME?.trim(),
  );
}

export async function sendCampaignWhatsAppInvite(
  input: WhatsAppTemplatePayload,
): Promise<WhatsAppCampaignDeliveryResult> {
  if (!isWhatsAppConfigured()) {
    return {
      sent: false,
      messageId: null,
      skippedReason: 'whatsapp_not_configured',
    };
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '';
  const templateName = process.env.WHATSAPP_CAMPAIGN_TEMPLATE_NAME?.trim() ?? '';
  const to = input.toPhoneE164.replace(/[^\d]/g, '');

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_CAMPAIGN_TEMPLATE_LANG?.trim() || 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: input.fromOrg },
              { type: 'text', text: input.campaignTitle },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: input.claimUrl }],
          },
        ],
      },
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      sent: false,
      messageId: null,
      skippedReason: body.error?.message ?? `whatsapp_http_${response.status}`,
    };
  }

  return {
    sent: true,
    messageId: body.messages?.[0]?.id ?? null,
    skippedReason: null,
  };
}
