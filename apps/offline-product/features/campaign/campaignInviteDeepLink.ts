import { router } from 'expo-router';

import {
  parseCampaignClaimTokenFromUrl,
  parseCampaignIdFromUrl,
  persistPendingCampaignClaimToken,
  persistPendingCampaignInviteId,
} from '@/features/campaign/campaignInviteContext';
import { fetchAndCacheCampaignInvitePreview } from '@/features/campaign/fetchAndCacheCampaignInvitePreview';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export function handleCampaignInviteDeepLink(url: string): boolean {
  const campaignId = parseCampaignIdFromUrl(url);
  if (!campaignId) return false;
  const claimToken = parseCampaignClaimTokenFromUrl(url);
  void persistPendingCampaignInviteId(campaignId);
  if (claimToken) {
    void persistPendingCampaignClaimToken(claimToken);
  }
  void fetchAndCacheCampaignInvitePreview(campaignId, claimToken);
  trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_DEEP_LINK_OPENED, {
    campaignId,
    hasClaimToken: Boolean(claimToken),
  });
  const params: Record<string, string> = { campaign: campaignId };
  if (claimToken) {
    params.token = claimToken;
  }
  router.push({ pathname: '/campaign', params });
  return true;
}
