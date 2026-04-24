import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required for issues.' }, { status: 503 });
    }
    const backendResponse = await fetch(`${backendBase}/v1/requests/issues`, {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : undefined,
      cache: 'no-store',
    });
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend issues request failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load issues.' },
      { status: 500 },
    );
  }
}
