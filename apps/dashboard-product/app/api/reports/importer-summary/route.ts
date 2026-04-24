import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for importer summary reporting.' },
        { status: 503 },
      );
    }
    const backendResponse = await fetch(`${backendBase}/v1/reports/importer-summary`, {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : undefined,
      cache: 'no-store',
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend importer summary request failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load importer summary reporting.' },
      { status: 500 },
    );
  }
}
