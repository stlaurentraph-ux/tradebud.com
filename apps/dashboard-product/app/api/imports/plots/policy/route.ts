import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

async function proxyBulkImport(request: Request, pathSuffix: string, method: string) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required for bulk import policy.' }, { status: 503 });
  }
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required.' }, { status: 401 });
  }

  const body =
    method === 'GET' ? undefined : JSON.stringify(await request.json().catch(() => ({})));
  const response = await fetch(backendApiUrl(backendBase, `/v1/imports/plots${pathSuffix}`), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body,
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  return NextResponse.json(payload, { status: response.status });
}

export async function GET(request: Request) {
  return proxyBulkImport(request, '/policy', 'GET');
}

export async function PATCH(request: Request) {
  return proxyBulkImport(request, '/policy', 'PATCH');
}
