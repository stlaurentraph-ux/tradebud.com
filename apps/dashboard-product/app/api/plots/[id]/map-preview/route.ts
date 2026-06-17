import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id } = await params;
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for plot map preview.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/plots/${encodeURIComponent(id)}/map-preview`),
      {
        cache: 'no-store',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    );

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend plot map preview request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load plot map preview.' },
      { status: 500 },
    );
  }
}
