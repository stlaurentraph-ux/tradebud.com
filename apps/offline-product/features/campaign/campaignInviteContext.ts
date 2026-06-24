import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CampaignInvitePreview } from './campaignInviteTypes';

export type { CampaignInvitePreview };

const STORAGE_KEY = 'tracebud_pending_campaign_invite';
const CLAIM_TOKEN_STORAGE_KEY = 'tracebud_pending_campaign_claim_token';
const PREVIEW_STORAGE_KEY = 'tracebud_pending_campaign_invite_preview';

export function parseCampaignIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const fromQuery =
      parsed.searchParams.get('campaign')?.trim() ||
      parsed.searchParams.get('campaignId')?.trim() ||
      null;
    if (fromQuery) return fromQuery;
    if (parsed.hostname === 'campaign' || parsed.pathname === '/campaign') {
      return parsed.searchParams.get('id')?.trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCampaignClaimTokenFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.searchParams.get('token')?.trim() || null;
  } catch {
    return null;
  }
}

export function isCampaignInviteDeepLink(url: string): boolean {
  return parseCampaignIdFromUrl(url) != null;
}

export async function readPendingCampaignInviteId(): Promise<string | null> {
  const value = (await AsyncStorage.getItem(STORAGE_KEY))?.trim();
  return value || null;
}

export async function readPendingCampaignClaimToken(): Promise<string | null> {
  const value = (await AsyncStorage.getItem(CLAIM_TOKEN_STORAGE_KEY))?.trim();
  return value || null;
}

export async function readPendingCampaignBootstrapContext(): Promise<{
  campaignId: string | null;
  claimToken: string | null;
}> {
  const [campaignId, claimToken] = await Promise.all([
    readPendingCampaignInviteId(),
    readPendingCampaignClaimToken(),
  ]);
  return { campaignId, claimToken };
}

export async function readPendingCampaignInvitePreview(): Promise<CampaignInvitePreview | null> {
  const raw = await AsyncStorage.getItem(PREVIEW_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CampaignInvitePreview;
    if (!parsed?.campaignId?.trim()) return null;
    return {
      campaignId: parsed.campaignId.trim(),
      title: parsed.title?.trim() || 'Farm data request',
      fromOrg: parsed.fromOrg?.trim() || '',
      dueAt: parsed.dueAt ?? null,
      senderTenantId: parsed.senderTenantId?.trim() || '',
      deliveryChannel: parsed.deliveryChannel,
      recipientLabel: parsed.recipientLabel?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export async function persistPendingCampaignInviteId(campaignId: string | null | undefined): Promise<void> {
  const trimmed = campaignId?.trim();
  if (!trimmed) return;
  await AsyncStorage.setItem(STORAGE_KEY, trimmed);
}

export async function persistPendingCampaignClaimToken(token: string | null | undefined): Promise<void> {
  const trimmed = token?.trim();
  if (!trimmed) return;
  await AsyncStorage.setItem(CLAIM_TOKEN_STORAGE_KEY, trimmed);
}

export async function persistPendingCampaignInvitePreview(
  preview: CampaignInvitePreview | null | undefined,
): Promise<void> {
  if (!preview?.campaignId?.trim()) return;
  await AsyncStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(preview));
}

export async function persistCampaignInvite(
  campaignId: string,
  preview?: CampaignInvitePreview | null,
  claimToken?: string | null,
): Promise<void> {
  await persistPendingCampaignInviteId(campaignId);
  if (claimToken?.trim()) {
    await persistPendingCampaignClaimToken(claimToken);
  }
  if (preview) {
    await persistPendingCampaignInvitePreview(preview);
  }
}

export async function clearPendingCampaignInviteId(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, CLAIM_TOKEN_STORAGE_KEY, PREVIEW_STORAGE_KEY]);
}

export async function consumePendingCampaignInviteId(): Promise<string | null> {
  const value = await readPendingCampaignInviteId();
  if (value) {
    await clearPendingCampaignInviteId();
  }
  return value;
}
