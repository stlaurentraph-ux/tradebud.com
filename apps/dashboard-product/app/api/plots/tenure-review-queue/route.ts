import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for tenure review queue.' },
        { status: 503 },
      );
    }

    const backendUrl = backendApiUrl(backendBase, '/v1/plots/tenure-review-queue');
    const backendResponse = await fetch(backendUrl, {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend tenure review queue request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load tenure review queue.' },
      { status: 500 },
    );
  }
}
