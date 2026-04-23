import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const response = await fetch(`${backendBase}/v1/contacts`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
    cache: 'no-store',
  });
  if (response.status === 404) {
    return NextResponse.json(
      {
        error:
          'Contacts backend endpoint is not available in this environment yet. Restart backend after deploying the contacts module.',
      },
      { status: 503 },
    );
  }
  const payload = await response
    .json()
    .catch(() => ({ error: `Failed to load contacts (status ${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: Request) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const response = await fetch(`${backendBase}/v1/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (response.status === 404) {
    return NextResponse.json(
      {
        error:
          'Contacts backend endpoint is not available in this environment yet. Restart backend after deploying the contacts module.',
      },
      { status: 503 },
    );
  }
  const payload = await response
    .json()
    .catch(() => ({ error: `Failed to create contact (status ${response.status}).` }));
  return NextResponse.json(payload, { status: response.status });
}

