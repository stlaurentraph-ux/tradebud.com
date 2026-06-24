import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import type { CampaignInvitePreview } from '@/features/campaign/campaignInviteTypes';

const API_BASE_URL = getTracebudApiBaseUrl();

function mapPreview(
  campaignId: string,
  preview?: Partial<CampaignInvitePreview>,
): CampaignInvitePreview {
  return {
    campaignId,
    title: preview?.title?.trim() || 'Farm data request',
    fromOrg: preview?.fromOrg?.trim() || '',
    dueAt: preview?.dueAt ?? null,
    senderTenantId: preview?.senderTenantId?.trim() || '',
    deliveryChannel: preview?.deliveryChannel,
    recipientLabel: preview?.recipientLabel?.trim() || undefined,
  };
}

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
    if (!preview?.campaignId?.trim() && !normalized) {
      return { ok: false, reason: 'server' };
    }
    return {
      ok: true,
      preview: mapPreview(preview?.campaignId?.trim() || normalized, preview),
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function fetchCampaignTokenInvitePreview(
  campaignId: string,
  token: string,
): Promise<
  { ok: true; preview: CampaignInvitePreview } | { ok: false; reason: 'not_found' | 'network' | 'server' }
> {
  const normalizedId = campaignId.trim();
  const normalizedToken = token.trim();
  if (!normalizedId || !normalizedToken) {
    return { ok: false, reason: 'not_found' };
  }
  try {
    const res = await fetch(
      `${API_BASE_URL}/v1/public/requests/campaigns/${encodeURIComponent(normalizedId)}/invite?token=${encodeURIComponent(normalizedToken)}`,
    );
    if (res.status === 404) {
      return { ok: false, reason: 'not_found' };
    }
    if (!res.ok) {
      return { ok: false, reason: 'server' };
    }
    const json = (await res.json()) as {
      preview?: Partial<CampaignInvitePreview> & {
        deliveryChannel?: CampaignInvitePreview['deliveryChannel'];
        recipientLabel?: string;
      };
    };
    const preview = json.preview;
    if (!preview) {
      return { ok: false, reason: 'server' };
    }
    return {
      ok: true,
      preview: mapPreview(normalizedId, {
        campaignId: normalizedId,
        title: preview.title,
        fromOrg: preview.fromOrg,
        dueAt: preview.dueAt ?? null,
        senderTenantId: preview.senderTenantId,
        deliveryChannel: preview.deliveryChannel,
        recipientLabel: preview.recipientLabel,
      }),
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
