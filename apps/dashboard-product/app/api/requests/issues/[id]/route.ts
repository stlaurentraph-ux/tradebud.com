import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  const { id } = await context.params;

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required for issues.' }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as { status?: IssueStatus };
    if (!body.status) {
      return NextResponse.json({ error: 'status is required.' }, { status: 400 });
    }

    const backendResponse = await fetch(backendApiUrl(backendBase, `/v1/requests/issues/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ status: body.status }),
      cache: 'no-store',
    });
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend issue update failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update issue.' },
      { status: 500 },
    );
  }
}
