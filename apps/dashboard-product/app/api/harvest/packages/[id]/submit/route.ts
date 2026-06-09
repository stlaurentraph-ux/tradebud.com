import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  const { id } = await context.params;

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for package submission.' },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { idempotencyKey?: string };

    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/harvest/packages/${encodeURIComponent(id)}/submit`),
      {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ idempotencyKey: body.idempotencyKey }),
      },
    );

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend package submission request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit package.' },
      { status: 500 },
    );
  }
}
