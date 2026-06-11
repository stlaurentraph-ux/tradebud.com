import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email?.trim()) {
    return NextResponse.json({ error: 'email query parameter is required.' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');
  const response = await fetch(
    backendApiUrl(backendBase, `/v1/farmers/resolve?email=${encodeURIComponent(email.trim())}`),
    {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: 'no-store',
    },
  );
  const payload = await response.json().catch(() => ({ error: `Resolve failed (${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}
