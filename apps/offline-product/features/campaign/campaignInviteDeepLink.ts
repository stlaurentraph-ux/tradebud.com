import { router } from 'expo-router';

import {
  parseCampaignIdFromUrl,
  persistPendingCampaignInviteId,
} from '@/features/campaign/campaignInviteContext';
import { fetchAndCacheCampaignInvitePreview } from '@/features/campaign/fetchAndCacheCampaignInvitePreview';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export function handleCampaignInviteDeepLink(url: string): boolean {
  const campaignId = parseCampaignIdFromUrl(url);
  if (!campaignId) return false;
  void persistPendingCampaignInviteId(campaignId);
  void fetchAndCacheCampaignInvitePreview(campaignId);
  trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_DEEP_LINK_OPENED, { campaignId });
  router.push({ pathname: '/campaign', params: { campaign: campaignId } });
  return true;
}
