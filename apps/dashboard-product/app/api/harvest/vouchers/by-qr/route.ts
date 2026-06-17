import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  const qrRef = new URL(request.url).searchParams.get('qrRef')?.trim();

  if (!qrRef) {
    return NextResponse.json({ error: 'qrRef is required.' }, { status: 400 });
  }

  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for voucher lookup.' },
      { status: 503 },
    );
  }

  const response = await fetch(
    backendApiUrl(backendBase, `/v1/harvest/vouchers/by-qr?qrRef=${encodeURIComponent(qrRef)}`),
    {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    },
  );

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
