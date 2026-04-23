import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const response = await fetch(`${backendBase}/v1/admin/users`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => []);
  return NextResponse.json(payload, { status: response.status });
}
