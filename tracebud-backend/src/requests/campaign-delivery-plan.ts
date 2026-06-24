const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CampaignDeliveryChannel = 'email' | 'desk_only';

export type CampaignDeliveryRecipient = {
  contact_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  delivery_channel: CampaignDeliveryChannel;
  delivery_address: string | null;
};

export type CampaignCrmContactRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

export function planCampaignDeliveries(
  contacts: readonly CampaignCrmContactRow[],
): CampaignDeliveryRecipient[] {
  return contacts.map((contact) => {
    const email = contact.email?.trim().toLowerCase() || null;
    const phone = contact.phone?.trim() || null;
    const hasEmail = Boolean(email && EMAIL_PATTERN.test(email));

    return {
      contact_id: contact.id,
      full_name: contact.full_name.trim() || contact.id,
      email: hasEmail ? email : null,
      phone,
      delivery_channel: hasEmail ? 'email' : 'desk_only',
      delivery_address: hasEmail ? email : phone,
    };
  });
}

export function legacyEmailDeliveryRecipients(
  emails: readonly string[],
): CampaignDeliveryRecipient[] {
  return Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => EMAIL_PATTERN.test(email)),
    ),
  ).map((email) => ({
    contact_id: `legacy:${email}`,
    full_name: email,
    email,
    phone: null,
    delivery_channel: 'email' as const,
    delivery_address: email,
  }));
}

export function countDeliverableRecipients(deliveries: readonly CampaignDeliveryRecipient[]): {
  total: number;
  email: number;
  desk_only: number;
} {
  const email = deliveries.filter((delivery) => delivery.delivery_channel === 'email').length;
  const desk_only = deliveries.filter((delivery) => delivery.delivery_channel === 'desk_only').length;
  return { total: deliveries.length, email, desk_only };
}
