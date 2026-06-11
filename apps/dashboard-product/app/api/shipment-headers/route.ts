import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const externalId = new URL(request.url).searchParams.get('externalId')?.trim();
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(backendApiUrl(backendBase, '/v1/shipment-headers'), {
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    shipments?: Array<{ external_id?: string | null; [key: string]: unknown }>;
  };

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  if (externalId) {
    const shipment = Array.isArray(payload.shipments)
      ? payload.shipments.find((row) => row.external_id === externalId) ?? null
      : null;
    return NextResponse.json({ shipment });
  }

  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => ({}));
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(backendApiUrl(backendBase, '/v1/shipment-headers'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
