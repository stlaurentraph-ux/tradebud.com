import type { CampaignRecipientOnboardingStatus } from './campaign-recipient-timeline';

export type CampaignRecipientShareLinks = {
  recipient_lane: 'dashboard' | 'field';
  connect_url: string;
  inbox_url: string | null;
};

type ActiveCampaignStatus = 'RUNNING' | 'PARTIAL' | 'COMPLETED' | 'EXPIRED';
type ResendCampaignStatus = ActiveCampaignStatus | 'DRAFT' | 'QUEUED' | 'CANCELLED';

const RESENDABLE = new Set<CampaignRecipientOnboardingStatus>(['invite_sent', 'signed_up', 'accepted']);
const ACTIVE = new Set<ActiveCampaignStatus>(['RUNNING', 'PARTIAL', 'COMPLETED', 'EXPIRED']);

export function buildCampaignRecipientShareLinks(input: {
  campaignId: string;
  isFarmerRecipient: boolean;
  dashboardBaseUrl: string;
  fieldAuthBaseUrl: string;
}): CampaignRecipientShareLinks {
  const id = input.campaignId.trim();
  if (input.isFarmerRecipient) {
    return {
      recipient_lane: 'field',
      connect_url: `${input.fieldAuthBaseUrl}/campaign?campaign=${encodeURIComponent(id)}`,
      inbox_url: null,
    };
  }
  const base = input.dashboardBaseUrl.replace(/\/$/, '');
  return {
    recipient_lane: 'dashboard',
    connect_url: `${base}/create-account?campaign=${encodeURIComponent(id)}`,
    inbox_url: `${base}/inbox?campaign=${encodeURIComponent(id)}`,
  };
}

export function isFarmerCampaignRecipient(
  recipient: Pick<
    import('./campaign-recipient-timeline').CampaignRecipientTimelineEntry,
    'contact_id' | 'recipient_email' | 'delivery_channel' | 'fulfillment_source'
  >,
  contactTypes: ReadonlyMap<string, 'farmer' | 'other'>,
): boolean {
  if (
    recipient.fulfillment_source === 'farmer_app_email' ||
    recipient.fulfillment_source === 'farmer_app_phone'
  ) {
    return true;
  }
  if (recipient.contact_id && contactTypes.get(recipient.contact_id) === 'farmer') {
    return true;
  }
  const email = recipient.recipient_email?.trim().toLowerCase();
  if (email && contactTypes.get(email) === 'farmer') {
    return true;
  }
  return recipient.delivery_channel === 'whatsapp';
}

export function enrichCampaignRecipientForSender(
  recipient: import('./campaign-recipient-timeline').CampaignRecipientTimelineEntry,
  input: {
    campaignId: string;
    campaignStatus: ResendCampaignStatus;
    dashboardBaseUrl: string;
    fieldAuthBaseUrl: string;
    isFarmerRecipient: boolean;
  },
): import('./campaign-recipient-timeline').CampaignRecipientTimelineEntry {
  const share_links = buildCampaignRecipientShareLinks({
    campaignId: input.campaignId,
    isFarmerRecipient: input.isFarmerRecipient,
    dashboardBaseUrl: input.dashboardBaseUrl,
    fieldAuthBaseUrl: input.fieldAuthBaseUrl,
  });
  const can_resend_invite = canResendCampaignRecipientInvite({
    onboardingStatus: recipient.onboarding_status,
    campaignStatus: input.campaignStatus,
    recipientEmail: recipient.recipient_email,
    deliveryChannel: recipient.delivery_channel,
  });
  return { ...recipient, share_links, can_resend_invite };
}

export function canResendCampaignRecipientInvite(input: {
  onboardingStatus: CampaignRecipientOnboardingStatus;
  campaignStatus: ResendCampaignStatus;
  recipientEmail: string | null | undefined;
  deliveryChannel: string | null | undefined;
}): boolean {
  const email = input.recipientEmail?.trim().toLowerCase() ?? '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || input.deliveryChannel === 'desk_only') {
    return false;
  }
  if (!ACTIVE.has(input.campaignStatus as ActiveCampaignStatus)) {
    return false;
  }
  return RESENDABLE.has(input.onboardingStatus);
}
