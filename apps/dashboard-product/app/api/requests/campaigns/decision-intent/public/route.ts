import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for public decision intent.' },
        { status: 503 },
      );
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }
    const backendResponse = await fetch(`${backendBase}/v1/public/requests/campaigns/decision-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend public decision intent failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record public decision intent.' },
      { status: 500 },
    );
  }
}

