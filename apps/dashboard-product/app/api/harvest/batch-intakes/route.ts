import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import { BATCH_EVENT_TYPE, auditRowToBatch } from '@/lib/batch-intake-service';

type ExporterBatchRecord = {
  id: string;
  batch_id: string;
  plot_id: string;
  plot_name: string;
  plot_area_hectares: number;
  farmer_name: string;
  weight_kg: number;
  expected_yield_kg_per_ha: number;
  date: string;
  status: 'pass' | 'warning' | 'blocked';
  exception_status?: 'none' | 'pending' | 'approved' | 'rejected';
};

async function fetchAuditBatches(tenantId: string, authHeader: string | null) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) return [];

  const url = new URL(backendApiUrl(backendBase, `/v1/audit`));
  url.searchParams.set('eventType', BATCH_EVENT_TYPE);
  url.searchParams.set('tenantId', tenantId);
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });

  if (!response.ok) return [];

  const rows = (await response.json().catch(() => [])) as Array<{
    id: string | number;
    timestamp: string;
    payload?: Record<string, unknown>;
  }>;

  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => auditRowToBatch(row))
    .filter((batch): batch is ExporterBatchRecord => Boolean(batch));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId')?.trim();

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  try {
    const batches = await fetchAuditBatches(tenantId, authHeader);
    return NextResponse.json({ batches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load batch intakes.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const body = (await request.json().catch(() => ({}))) as {
    tenantId?: string;
    batch?: ExporterBatchRecord;
  };

  const tenantId = body.tenantId?.trim();
  const batch = body.batch;

  if (!tenantId || !batch?.id || !batch.batch_id) {
    return NextResponse.json({ error: 'tenantId and batch are required.' }, { status: 400 });
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ batches: [batch], sink: 'local-only' }, { status: 202 });
  }

  try {
    const createResponse = await fetch(backendApiUrl(backendBase, `/v1/audit`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        eventType: BATCH_EVENT_TYPE,
        deviceId: 'dashboard-web',
        payload: {
          tenantId,
          batch,
          description: `Batch ${batch.batch_id} recorded for ${batch.plot_name}`,
        },
      }),
    });

    if (!createResponse.ok) {
      const payload = await createResponse.json().catch(() => ({}));
      return NextResponse.json(payload, { status: createResponse.status });
    }

    const batches = await fetchAuditBatches(tenantId, authHeader);
    return NextResponse.json({ batches, sink: 'backend' }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record batch intake.' },
      { status: 500 },
    );
  }
}
