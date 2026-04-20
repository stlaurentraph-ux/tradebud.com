import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const requestUrl = new URL(request.url);
    const referenceNumber = requestUrl.searchParams.get('referenceNumber')?.trim();
    if (!referenceNumber) {
      return NextResponse.json({ error: 'referenceNumber query param is required.' }, { status: 400 });
    }

    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for EUDR DDS status reads.' },
        { status: 503 },
      );
    }

    const backendUrl = `${backendBase}/v1/integrations/eudr/dds/status?referenceNumber=${encodeURIComponent(
      referenceNumber,
    )}`;
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend EUDR DDS status request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read EUDR DDS status.' },
      { status: 500 },
    );
  }
}

