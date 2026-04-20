import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id } = await params;
    const requestUrl = new URL(request.url);
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for plot geometry history.' },
        { status: 503 },
      );
    }

    const backendUrl = new URL(`${backendBase}/v1/plots/${encodeURIComponent(id)}/geometry-history`);
    ['limit', 'offset', 'sort', 'anomalyProfile', 'signalsOnly'].forEach((key) => {
      const value = requestUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    });

    const backendResponse = await fetch(backendUrl.toString(), {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend geometry history request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load plot geometry history.' },
      { status: 500 },
    );
  }
}
