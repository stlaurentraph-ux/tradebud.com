import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(backendApiUrl(backendBase, '/v1/billing/adoption-promo'), {
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
