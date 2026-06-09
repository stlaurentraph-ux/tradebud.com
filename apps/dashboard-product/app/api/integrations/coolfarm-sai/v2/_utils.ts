import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export function getBackendBase() {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for Cool Farm + SAI V2 operations.' },
      { status: 503 },
    );
  }
  return backendBase;
}

export async function proxyJson(
  request: Request,
  backendPath: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown },
) {
  const backendBase = getBackendBase();
  if (backendBase instanceof NextResponse) {
    return backendBase;
  }

  const authHeader = request.headers.get('authorization');
  const method = init?.method ?? 'GET';
  const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  const backendResponse = await fetch(`${backendApiUrl(backendBase, backendPath)}`, {
    method,
    cache: 'no-store',
    headers,
    body: method === 'POST' ? JSON.stringify(init?.body ?? {}) : undefined,
  });
  const payload = await backendResponse.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }
  return NextResponse.json(payload);
}
