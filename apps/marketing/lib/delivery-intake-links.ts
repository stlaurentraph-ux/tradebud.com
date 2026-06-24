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

export function buildMarketingDeliveryQrUrl(qrRef: string): string {
  const base = (process.env.NEXT_PUBLIC_DELIVERY_QR_BASE_URL ?? 'https://tracebud.com/d').replace(/\/$/, '');
  return `${base}/${qrRef.trim()}`;
}

export function buildMarketingDeliveryTripQrUrl(tripRef: string): string {
  const base = (process.env.NEXT_PUBLIC_DELIVERY_TRIP_QR_BASE_URL ?? 'https://tracebud.com/t').replace(/\/$/, '');
  return `${base}/${tripRef.trim()}`;
}
