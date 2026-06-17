import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  const response = await fetch(backendApiUrl(backendBase, `/v1/contacts/${encodeURIComponent(id)}`), {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  const payload = await response
    .json()
    .catch(() => ({ error: `Failed to load contact (status ${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const response = await fetch(backendApiUrl(backendBase, `/v1/contacts/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const payload = await response
    .json()
    .catch(() => ({ error: `Failed to update contact (status ${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  const response = await fetch(backendApiUrl(backendBase, `/v1/contacts/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  const payload = await response
    .json()
    .catch(() => ({ error: `Failed to delete contact (status ${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}
