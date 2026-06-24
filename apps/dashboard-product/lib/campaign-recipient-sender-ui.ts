import type { CampaignRecipientOnboardingStatus, CampaignRecipientTimelineEntry } from '@/lib/campaign-recipient-timeline';

export type CampaignRecipientShareLinks = {
  recipient_lane: 'dashboard' | 'field';
  connect_url: string;
  inbox_url: string | null;
};

export type CampaignRecipientSenderActions = {
  canCopyConnectLink: boolean;
  canCopyInboxLink: boolean;
  canResendInvite: boolean;
  connectUrl: string | null;
  inboxUrl: string | null;
};

const RESENDABLE: CampaignRecipientOnboardingStatus[] = ['invite_sent', 'signed_up', 'accepted'];

function isFieldRecipient(recipient: CampaignRecipientTimelineEntry): boolean {
  if (recipient.fulfillment_source === 'farmer_app_email' || recipient.fulfillment_source === 'farmer_app_phone') {
    return true;
  }
  return recipient.share_links?.recipient_lane === 'field';
}

export function buildCampaignShareLinks(
  campaignId: string,
  recipient: CampaignRecipientTimelineEntry,
): CampaignRecipientShareLinks {
  if (recipient.share_links) {
    return recipient.share_links;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dashboard.tracebud.com';
  if (isFieldRecipient(recipient)) {
    const fieldBase = process.env.NEXT_PUBLIC_FIELD_AUTH_URL?.replace(/\/$/, '') ?? 'https://app.tracebud.com';
    return {
      recipient_lane: 'field',
      connect_url: `${fieldBase}/campaign?campaign=${encodeURIComponent(campaignId)}`,
      inbox_url: null,
    };
  }
  return {
    recipient_lane: 'dashboard',
    connect_url: `${origin}/create-account?campaign=${encodeURIComponent(campaignId)}`,
    inbox_url: `${origin}/inbox?campaign=${encodeURIComponent(campaignId)}`,
  };
}

export function resolveCampaignRecipientSenderActions(
  campaignId: string,
  recipient: CampaignRecipientTimelineEntry,
): CampaignRecipientSenderActions {
  const links = buildCampaignShareLinks(campaignId, recipient);
  const hasEmail = Boolean(recipient.recipient_email?.trim());
  const isDeskOnly = recipient.delivery_channel === 'desk_only';
  const canShareLinks = RESENDABLE.includes(recipient.onboarding_status);
  const canResend =
    typeof recipient.can_resend_invite === 'boolean'
      ? recipient.can_resend_invite
      : hasEmail && !isDeskOnly && canShareLinks;

  return {
    canCopyConnectLink: canShareLinks && Boolean(links.connect_url) && hasEmail && !isDeskOnly,
    canCopyInboxLink: canShareLinks && Boolean(links.inbox_url) && hasEmail && !isDeskOnly,
    canResendInvite: canResend,
    connectUrl: links.connect_url,
    inboxUrl: links.inbox_url,
  };
}

export function summarizeOutreachFunnelCounts(
  counts: import('@/lib/campaign-recipient-timeline').CampaignRecipientStatusCounts | undefined,
): string {
  if (!counts) return '';
  const parts: string[] = [];
  if (counts.fulfilled > 0) parts.push(`${counts.fulfilled} fulfilled`);
  if (counts.signed_up > 0) parts.push(`${counts.signed_up} joined`);
  if (counts.invite_sent > 0) parts.push(`${counts.invite_sent} invited`);
  if (counts.refused > 0) parts.push(`${counts.refused} refused`);
  return parts.join(' · ');
}
