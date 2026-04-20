import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { assignmentId } = await params;
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for plot assignment lifecycle.' },
        { status: 503 },
      );
    }

    const payload = await request.json().catch(() => ({}));
    const backendResponse = await fetch(
      `${backendBase}/v1/plots/assignments/${encodeURIComponent(assignmentId)}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    );

    const body = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend assignment cancel request failed.' }));
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel assignment.' },
      { status: 500 },
    );
  }
}
