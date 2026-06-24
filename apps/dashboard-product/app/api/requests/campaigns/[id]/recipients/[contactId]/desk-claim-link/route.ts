import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for desk claim links.' },
        { status: 503 },
      );
    }
    const { id, contactId } = await params;
    const backendResponse = await fetch(
      backendApiUrl(
        backendBase,
        `/v1/requests/campaigns/${encodeURIComponent(id)}/recipients/${encodeURIComponent(contactId)}/desk-claim-link`,
      ),
      {
        method: 'POST',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend desk claim link request failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue desk claim link.' },
      { status: 500 },
    );
  }
}
