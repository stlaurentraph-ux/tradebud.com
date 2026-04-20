import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id } = await params;
    const requestUrl = new URL(request.url);
    const cutoffDate = requestUrl.searchParams.get('cutoffDate');
    if (!cutoffDate) {
      return NextResponse.json(
        { error: 'cutoffDate query param is required (YYYY-MM-DD).' },
        { status: 400 },
      );
    }

    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for deforestation decisions.' },
        { status: 503 },
      );
    }

    const backendUrl = `${backendBase}/v1/plots/${encodeURIComponent(id)}/deforestation-decision?cutoffDate=${encodeURIComponent(cutoffDate)}`;
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend deforestation decision request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run deforestation decision.' },
      { status: 500 },
    );
  }
}
