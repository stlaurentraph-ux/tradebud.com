const VOUCHER_QR_REF_PATTERN = /^V-[A-Z0-9]{6,12}$/i;
const TRIP_REF_PATTERN = /^T-[A-Z0-9]{6,12}$/i;

export function isDeliveryTripRef(value: string): boolean {
  return TRIP_REF_PATTERN.test((value ?? '').trim().toUpperCase());
}

/** Normalize multi-plot trip input: raw code or smart-link URL (`/t/T-…`). */
export function parseDeliveryTripRef(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (TRIP_REF_PATTERN.test(upper)) {
    return upper;
  }

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://tracebud.com');
    const segments = url.pathname.split('/').filter(Boolean);
    const tripSegment = segments.find((part) => TRIP_REF_PATTERN.test(part.toUpperCase()));
    if (tripSegment) {
      return tripSegment.toUpperCase();
    }
    const claim = url.searchParams.get('claim')?.trim();
    if (claim && TRIP_REF_PATTERN.test(claim.toUpperCase())) {
      return claim.toUpperCase();
    }
  } catch {
    // not a URL
  }

  const token = trimmed.split(/[/?#&=\s]+/).find((part) => TRIP_REF_PATTERN.test(part.toUpperCase()));
  return token ? token.toUpperCase() : null;
}

/** Normalize farmer/buyer input: raw code, pasted URL, or trailing path segment. */
export function parseDeliveryQrRef(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (VOUCHER_QR_REF_PATTERN.test(upper)) {
    return upper;
  }

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
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
    // not a URL — fall through
  }

  const token = trimmed.split(/[/?#&=\s]+/).find((part) => VOUCHER_QR_REF_PATTERN.test(part.toUpperCase()));
  return token ? token.toUpperCase() : null;
}

export function buildDeliveryQrPath(qrRef: string): string {
  const normalized = parseDeliveryQrRef(qrRef);
  if (!normalized) {
    throw new Error('Invalid delivery QR reference');
  }
  return `/d/${normalized}`;
}

export function buildDeliveryTripPath(tripRef: string): string {
  const normalized = parseDeliveryTripRef(tripRef);
  if (!normalized) {
    throw new Error('Invalid delivery trip reference');
  }
  return `/t/${normalized}`;
}

export function generateDeliveryTripRef(): string {
  return `T-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}
