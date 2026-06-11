import type { ShipmentStatus } from '@/types';

export type CanonicalShipmentHeader = {
  id: string;
  tenant_id: string;
  external_id: string | null;
  shipment_reference: string;
  label: string;
  status: ShipmentStatus;
  declared_quantity_kg: number;
  covered_quantity_kg: number;
  package_ids: string[];
  sealed_at: string | null;
  created_at: string;
  updated_at: string;
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string | { message?: string };
  };
  if (typeof body.message === 'string') {
    return body.message;
  }
  if (body.message && typeof body.message === 'object' && typeof body.message.message === 'string') {
    return body.message.message;
  }
  return body.error ?? fallback;
}

export async function listCanonicalShipmentHeaders(): Promise<CanonicalShipmentHeader[]> {
  const response = await fetch('/api/shipment-headers', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to load shipment headers.'));
  }
  const body = (await response.json()) as { shipments?: CanonicalShipmentHeader[] };
  return Array.isArray(body.shipments) ? body.shipments : [];
}

export async function getCanonicalShipmentHeader(
  shipmentHeaderId: string,
): Promise<CanonicalShipmentHeader> {
  const response = await fetch(
    `/api/shipment-headers/${encodeURIComponent(shipmentHeaderId)}`,
    { cache: 'no-store', headers: getAuthHeaders() },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to load shipment header.'));
  }
  const body = (await response.json()) as { shipment?: CanonicalShipmentHeader };
  if (!body.shipment?.id) {
    throw new Error('Shipment not found.');
  }
  return body.shipment;
}

export async function findCanonicalShipmentHeaderForPackage(
  packageId: string,
): Promise<CanonicalShipmentHeader | null> {
  const shipments = await listCanonicalShipmentHeaders();
  return (
    shipments.find((shipment) => shipment.package_ids.includes(packageId)) ??
    null
  );
}

export async function createCanonicalShipmentHeader(input: {
  externalId: string;
  shipmentReference: string;
  label: string;
  packageIds: string[];
  declaredQuantityKg: number;
  coveredQuantityKg: number;
}): Promise<CanonicalShipmentHeader> {
  const response = await fetch('/api/shipment-headers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() ?? {}),
    },
    body: JSON.stringify({
      externalId: input.externalId,
      shipmentReference: input.shipmentReference,
      label: input.label,
      packageIds: input.packageIds,
      declaredQuantityKg: input.declaredQuantityKg,
      coveredQuantityKg: input.coveredQuantityKg,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create shipment header.'));
  }

  const body = (await response.json()) as { shipment?: CanonicalShipmentHeader };
  if (!body.shipment?.id) {
    throw new Error('Shipment header was not returned by the backend.');
  }
  return body.shipment;
}

export async function sealCanonicalShipmentHeader(
  shipmentHeaderId: string,
): Promise<CanonicalShipmentHeader | null> {
  const response = await fetch(`/api/shipment-headers/${encodeURIComponent(shipmentHeaderId)}/seal`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? 'Failed to seal shipment.');
  }

  const body = (await response.json()) as { shipment?: CanonicalShipmentHeader };
  return body.shipment ?? null;
}

export async function resolveShipmentHeaderForAssembly(
  id: string,
  tenantId: string | null,
  loadAuditAssembly?: (tenantId: string) => Promise<Array<{
    id: string;
    shipment_reference: string;
    label: string;
    status: ShipmentStatus;
    declared_quantity_kg: number;
    covered_quantity_kg: number;
    package_ids: string[];
    created_at: string;
    updated_at: string;
  }>>,
): Promise<CanonicalShipmentHeader> {
  try {
    return await getCanonicalShipmentHeader(id);
  } catch {
    // Continue to legacy resolution paths.
  }

  const canonicalId = await resolveCanonicalShipmentHeaderId(id);
  if (canonicalId) {
    return getCanonicalShipmentHeader(canonicalId);
  }

  if (tenantId && loadAuditAssembly) {
    const rows = await loadAuditAssembly(tenantId);
    const match = rows.find((row) => row.id === id);
    if (match) {
      return {
        id: match.id,
        tenant_id: tenantId,
        external_id: match.id,
        shipment_reference: match.shipment_reference,
        label: match.label,
        status: match.status,
        declared_quantity_kg: match.declared_quantity_kg,
        covered_quantity_kg: match.covered_quantity_kg,
        package_ids: match.package_ids,
        sealed_at: match.status === 'SEALED' ? match.updated_at : null,
        created_at: match.created_at,
        updated_at: match.updated_at,
      };
    }
  }

  throw new Error('Shipment not found.');
}

export async function resolveCanonicalShipmentHeaderId(externalId: string): Promise<string | null> {
  const response = await fetch(
    `/api/shipment-headers?externalId=${encodeURIComponent(externalId)}`,
    { cache: 'no-store', headers: getAuthHeaders() },
  );
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { shipment?: CanonicalShipmentHeader };
  return body.shipment?.id ?? null;
}
