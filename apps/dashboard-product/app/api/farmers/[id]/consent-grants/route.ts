import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  const authHeader = request.headers.get('authorization');
  const response = await fetch(backendApiUrl(backendBase, `/v1/farmers/${encodeURIComponent(id)}/consent-grants`), {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: `Consent list failed (${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}
