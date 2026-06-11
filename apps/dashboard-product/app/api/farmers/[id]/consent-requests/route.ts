import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => null);
  const response = await fetch(
    backendApiUrl(backendBase, `/v1/farmers/${encodeURIComponent(id)}/consent-requests`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
    },
  );
  const payload = await response.json().catch(() => ({ error: `Consent request failed (${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}
