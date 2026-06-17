import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for voucher claim.' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { qrRef?: string };
  const qrRef = body.qrRef?.trim();
  if (!qrRef) {
    return NextResponse.json({ error: 'qrRef is required.' }, { status: 400 });
  }

  const response = await fetch(backendApiUrl(backendBase, '/v1/harvest/vouchers/claim'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ qrRef }),
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
