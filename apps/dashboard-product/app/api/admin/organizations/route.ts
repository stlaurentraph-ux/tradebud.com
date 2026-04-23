import { NextResponse } from 'next/server';

function backendBaseUrl(): string | null {
  return process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '') ?? null;
}

export async function GET(request: Request) {
  const backendBase = backendBaseUrl();
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const response = await fetch(`${backendBase}/v1/admin/organizations`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => []);
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: Request) {
  const backendBase = backendBaseUrl();
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const response = await fetch(`${backendBase}/v1/admin/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Failed to create organization.' }));
  return NextResponse.json(payload, { status: response.status });
}
