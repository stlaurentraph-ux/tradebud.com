import { describe, expect, it } from 'vitest';
import { enrichShipmentHeaderRow } from './shipment-header-mapper';
import type { CanonicalShipmentHeader } from './shipment-headers-client';
import type { DDSPackage } from '@/types';

const header: CanonicalShipmentHeader = {
  id: 'shp_1',
  tenant_id: 'tenant_1',
  external_id: 'shipment_audit_1',
  shipment_reference: 'SHP-2026-001',
  label: 'March export',
  status: 'DRAFT',
  declared_quantity_kg: 500,
  covered_quantity_kg: 500,
  package_ids: ['pkg_1'],
  sealed_at: null,
  created_at: '2026-03-01T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
};

const packages: DDSPackage[] = [
  {
    id: 'pkg_1',
    code: 'PKG-001',
    supplier_name: 'Rwanda Coffee Cooperative',
    season: 'A',
    year: 2026,
    status: 'DRAFT',
    compliance_status: 'PENDING',
    plots: [{ id: 'plot_1' } as DDSPackage['plots'][number]],
    farmers: [{ id: 'farmer_1' } as DDSPackage['farmers'][number]],
    tenant_id: 'tenant_1',
    created_by: 'system',
    created_at: '2026-03-01T09:00:00.000Z',
    updated_at: '2026-03-01T09:00:00.000Z',
    total_weight_kg: 500,
  },
];

describe('enrichShipmentHeaderRow', () => {
  it('maps canonical shipment headers to list rows with package enrichment', () => {
    const row = enrichShipmentHeaderRow(header, packages, 'Exporter ops');
    expect(row.code).toBe('SHP-2026-001');
    expect(row.org_name).toBe('Rwanda Coffee Cooperative');
    expect(row.owner).toBe('Exporter ops');
    expect(row.plots_count).toBe(1);
    expect(row.farmers_count).toBe(1);
    expect(row.batch_count).toBe(1);
    expect(row.has_blocking_issues).toBe(false);
  });
});
