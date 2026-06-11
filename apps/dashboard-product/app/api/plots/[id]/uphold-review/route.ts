import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for plot review decisions.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/plots/${encodeURIComponent(id)}/uphold-review`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body ?? {}),
        cache: 'no-store',
      },
    );
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend uphold-review request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to uphold plot review.' },
      { status: 500 },
    );
  }
}
