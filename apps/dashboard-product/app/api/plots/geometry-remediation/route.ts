import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for geometry remediation queue.' },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') ?? '50';
  const backendUrl = backendApiUrl(
    backendBase,
    `/v1/plots/geometry-remediation-queue?limit=${encodeURIComponent(limit)}`,
  );

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : undefined,
      cache: 'no-store',
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(body, { status: response.status });
    }
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load geometry remediation queue.' },
      { status: 500 },
    );
  }
}
