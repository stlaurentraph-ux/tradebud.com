import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for package listing.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(`${backendBase}/v1/harvest/packages`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend package listing request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch packages.' },
      { status: 500 },
    );
  }
}
