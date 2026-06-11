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
        { error: 'TRACEBUD_BACKEND_URL is required for compliance history.' },
        { status: 503 },
      );
    }

    const backendUrl = backendApiUrl(
      backendBase,
      `/v1/plots/${encodeURIComponent(id)}/compliance-history`,
    );
    const backendResponse = await fetch(backendUrl, {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend compliance history request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load compliance history.' },
      { status: 500 },
    );
  }
}
