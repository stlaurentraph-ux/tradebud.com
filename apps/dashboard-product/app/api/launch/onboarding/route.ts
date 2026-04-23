import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }
  const requestUrl = new URL(request.url);
  const role = requestUrl.searchParams.get('role');
  const backendUrl = new URL(`${backendBase}/v1/launch/onboarding`);
  if (role) backendUrl.searchParams.set('role', role);

  let response: Response;
  try {
    response = await fetch(backendUrl.toString(), {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach launch backend. Ensure backend server is running and reachable.',
      },
      { status: 503 },
    );
  }
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  let response: Response;
  try {
    response = await fetch(`${backendBase}/v1/launch/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach launch backend. Ensure backend server is running and reachable.',
      },
      { status: 503 },
    );
  }
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}
