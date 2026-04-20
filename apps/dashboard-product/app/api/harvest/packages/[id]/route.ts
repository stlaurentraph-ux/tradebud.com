import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  const { id } = await context.params;

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for package detail reads.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(`${backendBase}/v1/harvest/packages/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend package detail request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch package detail.' },
      { status: 500 },
    );
  }
}
