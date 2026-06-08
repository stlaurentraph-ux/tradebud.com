import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import { mapBackendPackagesResponse } from '@/lib/harvest-package-mapper';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const scope = new URL(request.url).searchParams.get('scope');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for package listing.' },
        { status: 503 },
      );
    }

    const query = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    const backendResponse = await fetch(backendApiUrl(backendBase, `/v1/harvest/packages${query}`), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend package listing request failed.' }));

    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    const packages = mapBackendPackagesResponse(payload, 'tenant_unknown');
    return NextResponse.json({ packages }, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch packages.' },
      { status: 500 },
    );
  }
}
