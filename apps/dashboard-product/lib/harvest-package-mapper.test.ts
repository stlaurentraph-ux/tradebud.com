import { describe, expect, it } from 'vitest';
import {
  mapBackendPackageDetailToDdsPackage,
  mapBackendPackageToDdsPackage,
} from '@/lib/harvest-package-mapper';

describe('mapBackendPackageToDdsPackage', () => {
  it('maps backend draft rows into dashboard shipment shape', () => {
    const mapped = mapBackendPackageToDdsPackage(
      {
        id: 'pkg-1',
        farmer_id: 'farmer-1',
        label: 'Lot A',
        status: 'draft',
        created_at: '2026-01-15T10:00:00.000Z',
        plot_count: 2,
        compliant_plot_count: 1,
      },
      'tenant_exporter',
    );

    expect(mapped.code).toBe('Lot A');
    expect(mapped.status).toBe('DRAFT');
    expect(mapped.plots).toHaveLength(2);
    expect(mapped.farmers).toHaveLength(1);
    expect(mapped.compliance_status).toBe('WARNINGS');
  });

  it('maps shared shipment metadata from sender org', () => {
    const mapped = mapBackendPackageToDdsPackage(
      {
        id: 'pkg-shared',
        status: 'submitted',
        created_at: '2026-02-01T10:00:00.000Z',
        sender_org: 'Rwanda Cooperative',
        sender_tenant_id: 'tenant_coop',
        plot_count: 1,
        compliant_plot_count: 1,
      },
      'tenant_importer',
    );

    expect(mapped.supplier_name).toBe('Rwanda Cooperative');
    expect(mapped.tenant_id).toBe('tenant_coop');
    expect(mapped.status).toBe('SUBMITTED');
  });

  it('maps backend detail vouchers into real plot rows', () => {
    const mapped = mapBackendPackageDetailToDdsPackage(
      {
        package: {
          id: 'pkg-detail',
          farmer_id: 'farmer-1',
          label: 'Export lot',
          status: 'draft',
          created_at: '2026-03-01T10:00:00.000Z',
        },
        vouchers: [
          {
            id: 'voucher-1',
            status: 'verified',
            plot_id: 'plot-1',
            plot_name: 'Hill plot',
            declared_area_ha: 2.5,
            created_at: '2026-03-01T10:00:00.000Z',
          },
          {
            id: 'voucher-2',
            status: 'pending',
            plot_id: 'plot-2',
            plot_name: 'Valley plot',
            area_ha: 1.2,
            created_at: '2026-03-01T10:00:00.000Z',
          },
        ],
      },
      'tenant_exporter',
    );

    expect(mapped.plots).toHaveLength(2);
    expect(mapped.plots[0]?.name).toBe('Hill plot');
    expect(mapped.plots[0]?.verified).toBe(true);
    expect(mapped.plots[1]?.verified).toBe(false);
    expect(mapped.compliance_status).toBe('WARNINGS');
  });
});
