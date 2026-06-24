export type CampaignInviteDeliveryChannel = 'email' | 'whatsapp' | 'desk_only';

export type CampaignInvitePreview = {
  campaignId: string;
  title: string;
  fromOrg: string;
  dueAt: string | null;
  senderTenantId: string;
  deliveryChannel?: CampaignInviteDeliveryChannel;
  recipientLabel?: string;
};
