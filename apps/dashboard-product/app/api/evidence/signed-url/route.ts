import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const storagePath = searchParams.get('storagePath')?.trim();
  if (!storagePath) {
    return NextResponse.json({ error: 'storagePath is required.' }, { status: 400 });
  }

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for evidence file access.' },
        { status: 503 },
      );
    }
    const params = new URLSearchParams({ storagePath });
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/requests/evidence-signed-url?${params.toString()}`),
      {
        method: 'GET',
        headers: authHeader ? { Authorization: authHeader } : undefined,
        cache: 'no-store',
      },
    );
    const payload = await backendResponse.json().catch(() => ({
      error: 'Backend evidence signed-url request failed.',
    }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign evidence URL.' },
      { status: 500 },
    );
  }
}
