import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for voucher listing.' },
      { status: 503 },
    );
  }

  const scope = new URL(request.url).searchParams.get('scope') ?? 'tenant';
  const farmerId = new URL(request.url).searchParams.get('farmerId');
  const query = new URLSearchParams({ scope });
  if (farmerId?.trim()) {
    query.set('farmerId', farmerId.trim());
  }

  const response = await fetch(backendApiUrl(backendBase, `/v1/harvest/vouchers?${query}`), {
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
