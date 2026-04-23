import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign archive.' },
        { status: 503 },
      );
    }
    const { id } = await params;
    const backendResponse = await fetch(`${backendBase}/v1/requests/campaigns/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign archive failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to archive request campaign.' },
      { status: 500 },
    );
  }
}

