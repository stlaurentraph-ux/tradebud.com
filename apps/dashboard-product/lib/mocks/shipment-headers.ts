import type { CanonicalShipmentHeader } from '@/lib/shipment-headers-client';

/** Demo assembled shipment headers linked to `mockPackages` ids. */
export const mockShipmentHeaders: CanonicalShipmentHeader[] = [
  {
    id: 'shp_001',
    tenant_id: 'tenant_brazil_001',
    external_id: 'SHP-EXT-2026-001',
    shipment_reference: 'SHP-2026-001',
    label: 'March Rwanda consolidated export',
    status: 'READY',
    declared_quantity_kg: 22_400,
    covered_quantity_kg: 22_400,
    package_ids: ['pkg_001', 'pkg_002'],
    sealed_at: null,
    created_at: '2026-03-15T10:00:00.000Z',
    updated_at: '2026-03-18T14:30:00.000Z',
  },
  {
    id: 'shp_002',
    tenant_id: 'tenant_brazil_001',
    external_id: 'SHP-EXT-2026-002',
    shipment_reference: 'SHP-2026-002',
    label: 'Lake Kivu single-origin lot',
    status: 'SEALED',
    declared_quantity_kg: 18_600,
    covered_quantity_kg: 18_600,
    package_ids: ['pkg_003'],
    sealed_at: '2026-04-01T09:15:00.000Z',
    created_at: '2026-03-28T08:00:00.000Z',
    updated_at: '2026-04-01T09:15:00.000Z',
  },
  {
    id: 'shp_003',
    tenant_id: 'tenant_brazil_001',
    external_id: 'SHP-EXT-2026-003',
    shipment_reference: 'SHP-2026-003',
    label: 'Eastern Province draft assembly',
    status: 'DRAFT',
    declared_quantity_kg: 9_200,
    covered_quantity_kg: 9_200,
    package_ids: ['pkg_005'],
    sealed_at: null,
    created_at: '2026-04-10T11:45:00.000Z',
    updated_at: '2026-04-10T11:45:00.000Z',
  },
];

export function listMockShipmentHeaders(): CanonicalShipmentHeader[] {
  return mockShipmentHeaders;
}

export function getMockShipmentHeaderById(lookupId: string): CanonicalShipmentHeader | null {
  const normalized = lookupId.trim();
  if (!normalized) return null;
  return (
    mockShipmentHeaders.find((header) => header.id === normalized) ??
    mockShipmentHeaders.find((header) => header.shipment_reference === normalized) ??
    mockShipmentHeaders.find((header) => header.external_id === normalized) ??
    null
  );
}
