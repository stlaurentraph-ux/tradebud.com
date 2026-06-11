import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');
  const { id } = await context.params;
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(backendApiUrl(backendBase, `/v1/shipment-headers/${encodeURIComponent(id)}`), {
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
