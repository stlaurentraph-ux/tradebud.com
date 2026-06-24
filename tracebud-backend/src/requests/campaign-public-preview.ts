export type CampaignPublicPreview = {
  campaignId: string;
  title: string;
  fromOrg: string;
  dueAt: string | null;
  senderTenantId: string;
};

export type CampaignInvitePublicPreview = CampaignPublicPreview & {
  deliveryChannel: 'email' | 'whatsapp' | 'desk_only';
  recipientLabel: string;
};
