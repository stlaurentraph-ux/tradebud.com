import type { ShipmentStatus } from '@/types';

export const SHIPMENT_ASSEMBLY_EVENT_TYPE = 'dashboard_shipment_assembly_recorded';

export type ShipmentAssemblyRecord = {
  id: string;
  shipment_reference: string;
  label: string;
  package_ids: string[];
  declared_quantity_kg: number;
  covered_quantity_kg: number;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function auditRowToShipmentAssembly(row: {
  id: string | number;
  timestamp: string;
  payload?: Record<string, unknown>;
}): ShipmentAssemblyRecord | null {
  const shipment = row.payload?.shipment;
  if (!shipment || typeof shipment !== 'object') return null;
  const record = shipment as ShipmentAssemblyRecord;
  if (!record.id || !record.shipment_reference) return null;
  return {
    ...record,
    package_ids: Array.isArray(record.package_ids) ? record.package_ids : [],
    declared_quantity_kg: Number(record.declared_quantity_kg ?? 0),
    covered_quantity_kg: Number(record.covered_quantity_kg ?? 0),
    created_at: record.created_at ?? row.timestamp,
    updated_at: record.updated_at ?? row.timestamp,
  };
}

export async function listShipmentAssemblies(tenantId: string): Promise<ShipmentAssemblyRecord[]> {
  try {
    const response = await fetch(
      `/api/harvest/shipment-assemblies?tenantId=${encodeURIComponent(tenantId)}`,
      { cache: 'no-store', headers: getAuthHeaders() },
    );
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { shipments?: ShipmentAssemblyRecord[] };
    return Array.isArray(body.shipments) ? body.shipments : [];
  } catch {
    return [];
  }
}

export async function recordShipmentAssembly(
  tenantId: string,
  shipment: ShipmentAssemblyRecord,
): Promise<{ persistedRemotely: boolean; shipments: ShipmentAssemblyRecord[] }> {
  try {
    const response = await fetch('/api/harvest/shipment-assemblies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() ?? {}),
      },
      body: JSON.stringify({ tenantId, shipment }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to record shipment assembly.');
    }

    const body = (await response.json()) as { shipments?: ShipmentAssemblyRecord[] };
    return {
      persistedRemotely: true,
      shipments: Array.isArray(body.shipments) ? body.shipments : [shipment],
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to record shipment assembly.');
  }
}

export function buildShipmentReference(year = new Date().getFullYear()): string {
  return `SHP-${year}-${String(Date.now()).slice(-6)}`;
}
