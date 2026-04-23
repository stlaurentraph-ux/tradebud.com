import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign listing.' },
        { status: 503 },
      );
    }
    const backendResponse = await fetch(`${backendBase}/v1/requests/campaigns`, {
      method: 'GET',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
    });
    if (backendResponse.status === 404) {
      return NextResponse.json(
        {
          error:
            'Request campaigns backend endpoint is not available in this environment yet. Restart backend after deploying the requests module.',
        },
        { status: 503 },
      );
    }
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign listing failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list request campaigns.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign creation.' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const idempotencyKey = request.headers.get('x-idempotency-key') ?? crypto.randomUUID();
    const backendResponse = await fetch(`${backendBase}/v1/requests/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    if (backendResponse.status === 404) {
      return NextResponse.json(
        {
          error:
            'Request campaigns backend endpoint is not available in this environment yet. Restart backend after deploying the requests module.',
        },
        { status: 503 },
      );
    }

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign creation failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create request campaign.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for request campaign update.' },
        { status: 503 },
      );
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }
    const campaignId = typeof body.campaign_id === 'string' ? body.campaign_id.trim() : '';
    if (!campaignId) {
      return NextResponse.json({ error: 'campaign_id is required for update.' }, { status: 400 });
    }
    const backendResponse = await fetch(`${backendBase}/v1/requests/campaigns/${encodeURIComponent(campaignId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    if (backendResponse.status === 404) {
      return NextResponse.json(
        {
          error:
            'Request campaigns backend endpoint is not available in this environment yet. Restart backend after deploying the requests module.',
        },
        { status: 503 },
      );
    }
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend request campaign update failed.' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update request campaign.' },
      { status: 500 },
    );
  }
}
