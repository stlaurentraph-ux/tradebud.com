const VOUCHER_QR_REF_PATTERN = /^V-[A-Z0-9]{6,12}$/i;
const TRIP_REF_PATTERN = /^T-[A-Z0-9]{6,12}$/i;

function parseDeliveryQrRef(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (VOUCHER_QR_REF_PATTERN.test(upper)) return upper;
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
  } catch {
    // not a URL
  }
  return null;
}

function parseDeliveryTripRef(input: string): string | null {
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
  } catch {
    // not a URL
  }
  return null;
}

export function generateDeliveryTripRef(): string {
  return `T-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

/** Smart-link payload for single delivery receipt QR codes (ADR-009). */
export function buildDeliveryQrUrl(qrRef: string): string {
  const normalized = parseDeliveryQrRef(qrRef);
  if (!normalized) {
    return qrRef.trim();
  }
  const base = (
    process.env.EXPO_PUBLIC_DELIVERY_QR_BASE_URL ?? 'https://tracebud.com/d'
  )
    .trim()
    .replace(/\/$/, '');
  return `${base}/${normalized}`;
}

/** Smart-link payload for multi-plot delivery trip QR codes (FEAT-011 Phase B). */
export function buildDeliveryTripQrUrl(tripRef: string): string {
  const normalized = parseDeliveryTripRef(tripRef) ?? tripRef.trim().toUpperCase();
  const base = (
    process.env.EXPO_PUBLIC_DELIVERY_TRIP_QR_BASE_URL ?? 'https://tracebud.com/t'
  )
    .trim()
    .replace(/\/$/, '');
  return `${base}/${normalized}`;
}
