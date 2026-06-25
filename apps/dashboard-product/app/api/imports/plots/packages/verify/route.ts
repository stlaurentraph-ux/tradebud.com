import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required for bulk import package verify.' }, { status: 503 });
  }
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const response = await fetch(backendApiUrl(backendBase, '/v1/imports/plots/packages/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  return NextResponse.json(payload, { status: response.status });
}
