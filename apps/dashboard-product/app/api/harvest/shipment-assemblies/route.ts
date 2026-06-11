import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import {
  SHIPMENT_ASSEMBLY_EVENT_TYPE,
  auditRowToShipmentAssembly,
  type ShipmentAssemblyRecord,
} from '@/lib/shipment-assembly-service';

async function fetchAuditShipments(tenantId: string, authHeader: string | null) {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) return [];

  const url = new URL(backendApiUrl(backendBase, `/v1/audit`));
  url.searchParams.set('eventType', SHIPMENT_ASSEMBLY_EVENT_TYPE);
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
    .map((row) => auditRowToShipmentAssembly(row))
    .filter((shipment): shipment is ShipmentAssemblyRecord => Boolean(shipment));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId')?.trim();

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  try {
    const shipments = await fetchAuditShipments(tenantId, authHeader);
    return NextResponse.json({ shipments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load shipment assemblies.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const body = (await request.json().catch(() => ({}))) as {
    tenantId?: string;
    shipment?: ShipmentAssemblyRecord;
  };

  const tenantId = body.tenantId?.trim();
  const shipment = body.shipment;

  if (!tenantId || !shipment?.id || !shipment.shipment_reference) {
    return NextResponse.json({ error: 'tenantId and shipment are required.' }, { status: 400 });
  }

  if (
    !Number.isFinite(shipment.declared_quantity_kg) ||
    shipment.declared_quantity_kg <= 0 ||
    !Number.isFinite(shipment.covered_quantity_kg) ||
    shipment.covered_quantity_kg <= 0
  ) {
    return NextResponse.json(
      { error: 'declared_quantity_kg and covered_quantity_kg are required.' },
      { status: 400 },
    );
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ shipments: [shipment], sink: 'local-only' }, { status: 202 });
  }

  try {
    const validateResponse = await fetch(backendApiUrl(backendBase, `/v1/harvest/shipment-weight/validate`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        packageIds: shipment.package_ids,
        declaredQuantityKg: shipment.declared_quantity_kg,
      }),
    });

    if (!validateResponse.ok) {
      const payload = (await validateResponse.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };
      const message = Array.isArray(payload.message)
        ? payload.message.join(' ')
        : payload.message ?? payload.error ?? 'Shipment weight does not match selected batch totals.';
      return NextResponse.json({ error: message }, { status: validateResponse.status });
    }

    const createResponse = await fetch(backendApiUrl(backendBase, `/v1/audit`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        eventType: SHIPMENT_ASSEMBLY_EVENT_TYPE,
        deviceId: 'dashboard-web',
        payload: {
          tenantId,
          shipment,
          description: `Shipment ${shipment.shipment_reference} assembled from ${shipment.package_ids.length} batch(es)`,
        },
      }),
    });

    if (!createResponse.ok) {
      const payload = await createResponse.json().catch(() => ({}));
      return NextResponse.json(payload, { status: createResponse.status });
    }

    const shipments = await fetchAuditShipments(tenantId, authHeader);
    return NextResponse.json({ shipments, sink: 'backend' }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record shipment assembly.' },
      { status: 500 },
    );
  }
}
