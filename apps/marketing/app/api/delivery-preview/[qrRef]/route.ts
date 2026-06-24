import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ qrRef: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const qrRef = (await context.params).qrRef?.trim();
  if (!qrRef) {
    return NextResponse.json({ error: 'qrRef is required.' }, { status: 400 });
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for delivery preview.' },
      { status: 503 },
    );
  }

  const response = await fetch(
    `${backendBase}/v1/public/harvest/delivery-preview/${encodeURIComponent(qrRef)}`,
    { cache: 'no-store' },
  );

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
