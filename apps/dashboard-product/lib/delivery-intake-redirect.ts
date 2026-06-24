const PENDING_CLAIM_STORAGE_KEY = 'tracebud_pending_delivery_claim';

export function extractClaimFromNextPath(nextPath: string | null | undefined): string | null {
  const trimmed = nextPath?.trim();
  if (!trimmed?.startsWith('/harvests')) return null;
  try {
    const url = new URL(trimmed, 'https://dashboard.tracebud.com');
    return url.searchParams.get('claim')?.trim() || null;
  } catch {
    return null;
  }
}

export function buildHarvestClaimPath(claimRef: string): string {
  return `/harvests?claim=${encodeURIComponent(claimRef.trim())}`;
}

export function readPendingDeliveryClaimRef(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(PENDING_CLAIM_STORAGE_KEY)?.trim();
  return value || null;
}

export function persistPendingDeliveryClaimRef(claimRef: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const trimmed = claimRef?.trim();
  if (!trimmed) return;
  sessionStorage.setItem(PENDING_CLAIM_STORAGE_KEY, trimmed);
}

export function clearPendingDeliveryClaimRef(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_CLAIM_STORAGE_KEY);
}

export function resolvePostAuthIntakeRedirect(
  claimFromQuery: string | null | undefined,
  fallbackPath: string,
): string {
  const claim = claimFromQuery?.trim() || readPendingDeliveryClaimRef();
  if (!claim) return fallbackPath;
  clearPendingDeliveryClaimRef();
  return buildHarvestClaimPath(claim);
}

export function buildDashboardSignupUrlForClaim(
  claimRef: string,
  dashboardOrigin = process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ?? 'https://dashboard.tracebud.com',
): string {
  const origin = dashboardOrigin.replace(/\/$/, '');
  return `${origin}/create-account?claim=${encodeURIComponent(claimRef.trim())}`;
}

export function buildDashboardLoginUrlForClaim(
  claimRef: string,
  dashboardOrigin = process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ?? 'https://dashboard.tracebud.com',
): string {
  const origin = dashboardOrigin.replace(/\/$/, '');
  return `${origin}/login?next=${encodeURIComponent(buildHarvestClaimPath(claimRef))}`;
}

export function buildCreateAccountHrefFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): string {
  const claim =
    searchParams.get('claim')?.trim() || extractClaimFromNextPath(searchParams.get('next'));
  if (!claim) return '/create-account';
  return `/create-account?claim=${encodeURIComponent(claim)}`;
}
