import { NextResponse } from 'next/server';
import { validateEudrDdsStatement } from '@/lib/eudr-dds-validation';

type SubmitDdsBody = {
  statement?: Record<string, unknown>;
  idempotencyKey?: string;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const body = (await request.json().catch(() => ({}))) as SubmitDdsBody;
    const statement = body?.statement;
    const idempotencyKey = body?.idempotencyKey?.trim();

    if (!statement || typeof statement !== 'object' || Array.isArray(statement)) {
      return NextResponse.json({ error: 'statement object is required.' }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required.' }, { status: 400 });
    }
    const schemaResult = validateEudrDdsStatement(statement);
    if (!schemaResult.valid) {
      return NextResponse.json({ error: schemaResult.error }, { status: 400 });
    }

    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for EUDR DDS submission.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(`${backendBase}/v1/integrations/eudr/dds`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ statement, idempotencyKey }),
    });
    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend EUDR DDS submission failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit EUDR DDS.' },
      { status: 500 },
    );
  }
}

