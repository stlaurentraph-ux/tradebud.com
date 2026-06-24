const PENDING_CAMPAIGN_STORAGE_KEY = 'tracebud_pending_supplier_campaign';

export function extractCampaignFromNextPath(nextPath: string | null | undefined): string | null {
  const trimmed = nextPath?.trim();
  if (!trimmed?.startsWith('/')) return null;
  try {
    const url = new URL(trimmed, 'https://dashboard.tracebud.com');
    return url.searchParams.get('campaign')?.trim() || null;
  } catch {
    return null;
  }
}

export function buildInboxCampaignPath(campaignId: string): string {
  return `/inbox?campaign=${encodeURIComponent(campaignId.trim())}`;
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

export function resolvePostAuthSupplierCampaignRedirect(
  campaignFromQuery: string | null | undefined,
  fallbackPath: string,
): string {
  const campaignId = campaignFromQuery?.trim() || readPendingSupplierCampaignId();
  if (!campaignId) return fallbackPath;
  clearPendingSupplierCampaignId();
  return buildInboxCampaignPath(campaignId);
}

export function resolvePostAuthNetworkRedirect(input: {
  claimRef?: string | null;
  campaignId?: string | null;
  fallbackPath: string;
  resolveClaim: (claimRef: string | null | undefined, fallbackPath: string) => string;
}): string {
  const claim = input.claimRef?.trim();
  if (claim) {
    return input.resolveClaim(claim, input.fallbackPath);
  }
  return resolvePostAuthSupplierCampaignRedirect(input.campaignId, input.fallbackPath);
}

export function buildCreateAccountHrefFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): string {
  const params = new URLSearchParams();
  const campaign =
    searchParams.get('campaign')?.trim() || extractCampaignFromNextPath(searchParams.get('next'));
  const claim =
    searchParams.get('claim')?.trim() ||
    (() => {
      const next = searchParams.get('next');
      if (!next?.startsWith('/harvests')) return null;
      try {
        return new URL(next, 'https://dashboard.tracebud.com').searchParams.get('claim')?.trim() || null;
      } catch {
        return null;
      }
    })();
  if (campaign) params.set('campaign', campaign);
  if (claim) params.set('claim', claim);
  const role = searchParams.get('role')?.trim();
  if (role) params.set('role', role);
  const query = params.toString();
  return query ? `/create-account?${query}` : '/create-account';
}

export function buildDashboardSignupUrlForCampaign(
  campaignId: string,
  dashboardOrigin = process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ?? 'https://dashboard.tracebud.com',
): string {
  const origin = dashboardOrigin.replace(/\/$/, '');
  return `${origin}/create-account?campaign=${encodeURIComponent(campaignId.trim())}`;
}

export function findInboxRequestForCampaign<T extends { campaign_id: string; id: string }>(
  requests: T[],
  campaignId: string,
  tenantId?: string | null,
): T | undefined {
  const normalized = campaignId.trim();
  if (!normalized) return undefined;
  return requests.find(
    (request) =>
      request.campaign_id === normalized ||
      (tenantId ? request.id === `req_${normalized}_${tenantId}` : false),
  );
}
