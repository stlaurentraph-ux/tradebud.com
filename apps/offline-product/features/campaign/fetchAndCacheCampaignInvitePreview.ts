import {
  fetchCampaignPublicPreview,
  fetchCampaignTokenInvitePreview,
} from '@/features/api/campaignPreview';
import {
  persistCampaignInvite,
  readPendingCampaignClaimToken,
  type CampaignInvitePreview,
} from '@/features/campaign/campaignInviteContext';

export async function fetchAndCacheCampaignInvitePreview(
  campaignId: string,
  claimToken?: string | null,
): Promise<CampaignInvitePreview | null> {
  const trimmed = campaignId.trim();
  if (!trimmed) return null;

  const token = claimToken?.trim() || (await readPendingCampaignClaimToken());
  const res = token
    ? await fetchCampaignTokenInvitePreview(trimmed, token)
    : await fetchCampaignPublicPreview(trimmed);

  if (res.ok) {
    await persistCampaignInvite(trimmed, res.preview, token);
    return res.preview;
  }
  await persistCampaignInvite(trimmed, undefined, token);
  return null;
}
