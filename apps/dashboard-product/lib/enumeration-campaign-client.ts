import { getAuthHeaders } from '@/lib/auth-headers';
import { parseBackendErrorMessage } from '@/lib/request-campaign-payload';
import type {
  EnumerationCampaignProgress,
  EnumerationMappingRegion,
} from '@/lib/enumeration-campaign-types';

export async function fetchEnumerationCampaignProgress(
  campaignId: string,
): Promise<EnumerationCampaignProgress> {
  const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/enumeration-progress`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBackendErrorMessage(body, 'Failed to load enumeration progress.'));
  }
  return body as EnumerationCampaignProgress;
}

export async function saveCampaignMappingRegion(
  campaignId: string,
  region: EnumerationMappingRegion,
): Promise<{ campaign_id: string; mappingRegion: EnumerationMappingRegion }> {
  const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/mapping-region`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      label: region.label,
      west: region.bbox.west,
      south: region.bbox.south,
      east: region.bbox.east,
      north: region.bbox.north,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBackendErrorMessage(body, 'Failed to save mapping region.'));
  }
  return body as { campaign_id: string; mappingRegion: EnumerationMappingRegion };
}
