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
        { error: 'TRACEBUD_BACKEND_URL is required for plot assignment lifecycle.' },
        { status: 503 },
      );
    }

    const backendUrl = new URL(`${backendBase}/v1/plots/${encodeURIComponent(id)}/assignments`);
    ['status', 'fromDays', 'agentUserId', 'limit', 'offset', 'format'].forEach((key) => {
      const value = requestUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    });
    const backendResponse = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : undefined,
      cache: 'no-store',
    });
    if (requestUrl.searchParams.get('format') === 'csv') {
      const textBody = await backendResponse.text();
      return new Response(textBody, {
        status: backendResponse.status,
        headers: {
          'Content-Type': backendResponse.headers.get('content-type') ?? 'text/csv; charset=utf-8',
          'Content-Disposition':
            backendResponse.headers.get('content-disposition') ?? `attachment; filename="plot-${id}-assignments.csv"`,
          'X-Export-Row-Count': backendResponse.headers.get('x-export-row-count') ?? '0',
        },
      });
    }
    const body = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend assignment list request failed.' }));
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list plot assignments.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  try {
    const { id } = await params;
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for plot assignment lifecycle.' },
        { status: 503 },
      );
    }

    const payload = await request.json().catch(() => ({}));
    const backendResponse = await fetch(`${backendBase}/v1/plots/${encodeURIComponent(id)}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const body = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend assignment create request failed.' }));
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create plot assignment.' },
      { status: 500 },
    );
  }
}
