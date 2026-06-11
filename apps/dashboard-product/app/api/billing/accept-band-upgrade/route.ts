import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(backendApiUrl(backendBase, '/v1/billing/accept-band-upgrade'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
