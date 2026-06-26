import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');

  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for handoff confirmation.' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    intakeRef?: string;
    receivedKg?: number;
    note?: string;
  };

  const response = await fetch(backendApiUrl(backendBase, '/v1/harvest/vouchers/handoff-confirm'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
