import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; verificationId: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id, verificationId } = await params;
    const body = await request.json().catch(() => ({}));
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for tenure review confirmation.' },
        { status: 503 },
      );
    }

    const backendUrl = backendApiUrl(
      backendBase,
      `/v1/plots/${encodeURIComponent(id)}/tenure-verification/${encodeURIComponent(verificationId)}/confirm-review`,
    );
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend tenure review confirmation failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to confirm tenure review.',
      },
      { status: 500 },
    );
  }
}
