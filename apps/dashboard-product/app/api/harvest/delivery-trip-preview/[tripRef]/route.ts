import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import { reportDeliveryPreviewProxyOutcome } from '@/lib/observability/delivery-preview-proxy';

type RouteContext = { params: Promise<{ tripRef: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const tripRef = (await context.params).tripRef?.trim();
  if (!tripRef) {
    return NextResponse.json({ error: 'tripRef is required.' }, { status: 400 });
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for delivery trip preview.' },
      { status: 503 },
    );
  }

  const response = await fetch(
    backendApiUrl(backendBase, `/v1/public/harvest/delivery-trip-preview/${encodeURIComponent(tripRef)}`),
    { cache: 'no-store' },
  );

  reportDeliveryPreviewProxyOutcome({
    route: 'delivery-trip-preview',
    ref: tripRef,
    status: response.status,
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
