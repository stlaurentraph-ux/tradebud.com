import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for inbox response actions.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/inbox-requests/${encodeURIComponent(id)}/respond`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to respond to request.' },
      { status: 500 }
    );
  }
}
