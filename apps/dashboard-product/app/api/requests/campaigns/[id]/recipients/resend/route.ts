import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
    }
    const { id } = await params;
    const payload = await request.json().catch(() => ({}));
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/requests/campaigns/${encodeURIComponent(id)}/recipients/resend`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      },
    );
    const body = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invite.' },
      { status: 500 },
    );
  }
}
