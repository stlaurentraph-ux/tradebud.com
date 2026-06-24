import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for enumeration progress.' },
        { status: 503 },
      );
    }
    const { id } = await params;
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/requests/campaigns/${encodeURIComponent(id)}/enumeration-progress`),
      {
        method: 'GET',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        cache: 'no-store',
      },
    );
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend enumeration progress failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load enumeration progress.' },
      { status: 500 },
    );
  }
}
