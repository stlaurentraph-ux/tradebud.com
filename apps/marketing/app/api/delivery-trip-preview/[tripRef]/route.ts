import { NextResponse } from 'next/server';

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
    `${backendBase}/v1/public/harvest/delivery-trip-preview/${encodeURIComponent(tripRef)}`,
    { cache: 'no-store' },
  );

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
