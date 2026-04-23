import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(`${backendBase}/v1/launch/entitlements`, {
    cache: 'no-store',
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${backendBase}/v1/launch/entitlements`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}
