const VOUCHER_QR_REF_PATTERN = /^V-[A-Z0-9]{6,12}$/i;
const TRIP_REF_PATTERN = /^T-[A-Z0-9]{6,12}$/i;

export function isDeliveryTripRef(value: string): boolean {
  return TRIP_REF_PATTERN.test((value ?? '').trim().toUpperCase());
}

export function parseDeliveryTripRef(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (TRIP_REF_PATTERN.test(upper)) return upper;
  try {
    const url =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed)
        : new URL(trimmed, 'https://tracebud.com');
    const segments = url.pathname.split('/').filter(Boolean);
    const tripSegment = segments.find((part) => TRIP_REF_PATTERN.test(part.toUpperCase()));
    if (tripSegment) return tripSegment.toUpperCase();
    const claim = url.searchParams.get('claim')?.trim();
    if (claim && TRIP_REF_PATTERN.test(claim.toUpperCase())) return claim.toUpperCase();
  } catch {
    // not a URL
  }
  const token = trimmed.split(/[/?#&=\s]+/).find((part) => TRIP_REF_PATTERN.test(part.toUpperCase()));
  return token ? token.toUpperCase() : null;
}

export function parseDeliveryQrRef(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;

  const tripRef = parseDeliveryTripRef(trimmed);
  if (tripRef) return null;

  const upper = trimmed.toUpperCase();
  if (VOUCHER_QR_REF_PATTERN.test(upper)) {
    return upper;
  }

  try {
    const url =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed)
        : new URL(trimmed, 'https://tracebud.com');
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && VOUCHER_QR_REF_PATTERN.test(last.toUpperCase())) {
      return last.toUpperCase();
    }
    const claim = url.searchParams.get('claim')?.trim();
    if (claim && VOUCHER_QR_REF_PATTERN.test(claim.toUpperCase())) {
      return claim.toUpperCase();
    }
  } catch {
    // not a URL
  }

  const token = trimmed.split(/[/?#&=\s]+/).find((part) => VOUCHER_QR_REF_PATTERN.test(part.toUpperCase()));
  return token ? token.toUpperCase() : null;
}

export function parseDeliveryIntakeRef(input: string): { kind: 'voucher'; ref: string } | { kind: 'trip'; ref: string } | null {
  const tripRef = parseDeliveryTripRef(input);
  if (tripRef) return { kind: 'trip', ref: tripRef };
  const qrRef = parseDeliveryQrRef(input);
  if (qrRef) return { kind: 'voucher', ref: qrRef };
  return null;
}

export function buildDeliveryQrUrl(qrRef: string, baseUrl?: string): string {
  const normalized = parseDeliveryQrRef(qrRef);
  if (!normalized) {
    throw new Error('Invalid delivery QR reference');
  }
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_DELIVERY_QR_BASE_URL ?? 'https://tracebud.com/d')
    .trim()
    .replace(/\/$/, '');
  return `${base}/${normalized}`;
}

export function buildDeliveryTripQrUrl(tripRef: string, baseUrl?: string): string {
  const normalized = parseDeliveryTripRef(tripRef);
  if (!normalized) {
    throw new Error('Invalid delivery trip reference');
  }
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_DELIVERY_TRIP_QR_BASE_URL ?? 'https://tracebud.com/t')
    .trim()
    .replace(/\/$/, '');
  return `${base}/${normalized}`;
}

export function buildDashboardClaimUrl(ref: string, dashboardOrigin?: string): string {
  const parsed = parseDeliveryIntakeRef(ref);
  if (!parsed) {
    throw new Error('Invalid delivery intake reference');
  }
  const origin = (dashboardOrigin ?? process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ?? 'https://dashboard.tracebud.com')
    .trim()
    .replace(/\/$/, '');
  return `${origin}/harvests?claim=${encodeURIComponent(parsed.ref)}`;
}

export type DeliveryPublicPreview = {
  qrRef: string;
  kg: number | null;
  harvestDate: string | null;
  plotName: string | null;
  plotComplianceStatus: string | null;
  eligibleForBuyerIntake: boolean;
  intakeBlockReason: 'plot_not_ready' | 'already_packaged' | null;
  directedToBuyer: boolean;
  createdAt: string;
};

export type DeliveryTripPublicPreview = {
  tripRef: string;
  lineCount: number;
  totalKg: number;
  directedToBuyer: boolean;
  createdAt: string;
  lines: DeliveryPublicPreview[];
};
