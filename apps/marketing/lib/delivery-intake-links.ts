const DASHBOARD_ORIGIN = (process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ?? 'https://dashboard.tracebud.com').replace(
  /\/$/,
  '',
);

export function buildDashboardClaimUrl(claimRef: string): string {
  return `${DASHBOARD_ORIGIN}/harvests?claim=${encodeURIComponent(claimRef.trim())}`;
}

export function buildDashboardSignupUrlForClaim(claimRef: string): string {
  return `${DASHBOARD_ORIGIN}/create-account?claim=${encodeURIComponent(claimRef.trim())}`;
}

export function buildDashboardLoginUrlForClaim(claimRef: string): string {
  return `${DASHBOARD_ORIGIN}/login?next=${encodeURIComponent(buildDashboardClaimUrl(claimRef))}`;
}
