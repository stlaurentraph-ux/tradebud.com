import { fetchCampaignPublicPreview } from '@/features/api/campaignPreview';
import {
  persistCampaignInvite,
  type CampaignInvitePreview,
} from '@/features/campaign/campaignInviteContext';

export async function fetchAndCacheCampaignInvitePreview(
  campaignId: string,
): Promise<CampaignInvitePreview | null> {
  const trimmed = campaignId.trim();
  if (!trimmed) return null;
  const res = await fetchCampaignPublicPreview(trimmed);
  if (res.ok) {
    await persistCampaignInvite(trimmed, res.preview);
    return res.preview;
  }
  await persistCampaignInvite(trimmed);
  return null;
}
