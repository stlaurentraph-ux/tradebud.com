const PENDING_CAMPAIGN_STORAGE_KEY = 'tracebud_pending_supplier_campaign';

export function extractCampaignFromNextPath(nextPath: string | null | undefined): string | null {
  const trimmed = nextPath?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, 'https://dashboard.tracebud.com');
    return url.searchParams.get('campaign')?.trim() || null;
  } catch {
    return null;
  }
}

export function readPendingSupplierCampaignId(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(PENDING_CAMPAIGN_STORAGE_KEY)?.trim();
  return value || null;
}

export function persistPendingSupplierCampaignId(campaignId: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const trimmed = campaignId?.trim();
  if (!trimmed) return;
  sessionStorage.setItem(PENDING_CAMPAIGN_STORAGE_KEY, trimmed);
}

export function clearPendingSupplierCampaignId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_CAMPAIGN_STORAGE_KEY);
}

export function buildNetworkOutreachPath(campaignId: string): string {
  return `/outreach?campaign=${encodeURIComponent(campaignId.trim())}`;
}

export function resolvePostAuthNetworkRedirect(params: {
  claimRef: string | null | undefined;
  campaignId: string | null | undefined;
  fallbackPath: string;
  resolveClaim: (claimRef: string | null | undefined, fallbackPath: string) => string;
}): string {
  const campaign = params.campaignId?.trim() || readPendingSupplierCampaignId();
  if (campaign) {
    clearPendingSupplierCampaignId();
    return buildNetworkOutreachPath(campaign);
  }
  return params.resolveClaim(params.claimRef, params.fallbackPath);
}

export function buildCreateAccountHrefFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): string {
  const campaign = searchParams.get('campaign')?.trim();
  const claim = searchParams.get('claim')?.trim();
  const next = searchParams.get('next')?.trim();

  const params = new URLSearchParams();
  if (claim) params.set('claim', claim);
  if (campaign) params.set('campaign', campaign);
  if (!claim && !campaign && next) {
    params.set('next', next);
  }
  const query = params.toString();
  return query ? `/create-account?${query}` : '/create-account';
}
