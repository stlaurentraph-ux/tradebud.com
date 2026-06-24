import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required for mapping region update.' }, { status: 503 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }
    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/requests/campaigns/${encodeURIComponent(id)}/mapping-region`),
      { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) }, body: JSON.stringify(body) },
    );
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend mapping region update failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update mapping region.' }, { status: 500 });
  }
}
