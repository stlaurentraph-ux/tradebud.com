import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const countryIso = url.searchParams.get('countryIso') ?? '';
  const cadastralKey = url.searchParams.get('cadastralKey') ?? '';

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for cadastral parcel lookup.' },
        { status: 503 },
      );
    }

    const query = new URLSearchParams({ countryIso, cadastralKey });
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/cadastral/parcels/lookup?${query.toString()}`),
      {
        cache: 'no-store',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    );

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend cadastral lookup request failed.' }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to lookup cadastral parcel.' },
      { status: 500 },
    );
  }
}
