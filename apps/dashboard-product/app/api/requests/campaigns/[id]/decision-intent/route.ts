import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign decision intent.' },
        { status: 503 },
      );
    }
    const payload = await request
      .json()
      .catch(() => ({ decision: undefined as 'accept' | 'refuse' | undefined }));
    const { id } = await params;
    const backendResponse = await fetch(
      `${backendBase}/v1/requests/campaigns/${encodeURIComponent(id)}/decision-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      },
    );
    const body = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign decision intent failed.' }));
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record request campaign decision intent.' },
      { status: 500 },
    );
  }
}

