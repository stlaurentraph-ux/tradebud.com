import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  const response = await fetch(`${backendBase}/v1/launch/state`, {
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}
