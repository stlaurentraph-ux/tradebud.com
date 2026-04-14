import { NextResponse } from 'next/server';

type BootstrapAction = 'reset' | 'seed_first_customer' | 'seed_golden_path';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: BootstrapAction };
  const action = body.action;
  const authHeader = request.headers.get('authorization');

  if (!action) {
    return NextResponse.json({ error: 'action is required.' }, { status: 400 });
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for inbox bootstrap actions.' },
      { status: 503 }
    );
  }

  try {
    const backendResponse = await fetch(`${backendBase}/api/v1/inbox-requests/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ action }),
    });
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute inbox bootstrap action.' },
      { status: 500 }
    );
  }
}
