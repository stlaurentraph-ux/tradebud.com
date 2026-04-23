import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign decision timeline.' },
        { status: 503 },
      );
    }
    const { id } = await params;
    const requestUrl = new URL(request.url);
    const decision = requestUrl.searchParams.get('decision')?.trim();
    const limit = requestUrl.searchParams.get('limit')?.trim();
    const offset = requestUrl.searchParams.get('offset')?.trim();
    const backendParams = new URLSearchParams();
    if (decision) backendParams.set('decision', decision);
    if (limit) backendParams.set('limit', limit);
    if (offset) backendParams.set('offset', offset);
    const query = backendParams.toString();
    const backendResponse = await fetch(
      `${backendBase}/v1/requests/campaigns/${encodeURIComponent(id)}/decisions${query ? `?${query}` : ''}`,
      {
        method: 'GET',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign decision timeline failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load request campaign decision timeline.' },
      { status: 500 },
    );
  }
}
