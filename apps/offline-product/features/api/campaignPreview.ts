import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import type { CampaignInvitePreview } from '@/features/campaign/campaignInviteTypes';

const API_BASE_URL = getTracebudApiBaseUrl();

export async function fetchCampaignPublicPreview(
  campaignId: string,
): Promise<
  { ok: true; preview: CampaignInvitePreview } | { ok: false; reason: 'not_found' | 'network' | 'server' }
> {
  const normalized = campaignId.trim();
  if (!normalized) {
    return { ok: false, reason: 'not_found' };
  }
  try {
    const res = await fetch(
      `${API_BASE_URL}/v1/public/requests/campaigns/${encodeURIComponent(normalized)}/preview`,
    );
    if (res.status === 404) {
      return { ok: false, reason: 'not_found' };
    }
    if (!res.ok) {
      return { ok: false, reason: 'server' };
    }
    const json = (await res.json()) as { preview?: Partial<CampaignInvitePreview> };
    const preview = json.preview;
    if (!preview?.campaignId?.trim()) {
      return { ok: false, reason: 'server' };
    }
    return {
      ok: true,
      preview: {
        campaignId: preview.campaignId.trim(),
        title: preview.title?.trim() || 'Farm data request',
        fromOrg: preview.fromOrg?.trim() || '',
        dueAt: preview.dueAt ?? null,
        senderTenantId: preview.senderTenantId?.trim() || '',
      },
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
