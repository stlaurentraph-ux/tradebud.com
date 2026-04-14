import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for inbox requests.' },
        { status: 503 }
      );
    }

    const backendResponse = await fetch(`${backendBase}/api/v1/inbox-requests`, {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load inbox requests.' },
      { status: 500 }
    );
  }
}
