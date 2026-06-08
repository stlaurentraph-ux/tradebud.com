// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildShipmentSlaSnapshots, calculateSlaHealth, daysInCurrentStatus } from './package-sla';
import type { DDSPackage } from '@/types';

const basePackage = (overrides: Partial<DDSPackage>): DDSPackage => ({
  id: 'pkg-1',
  code: 'SHIP-001',
  supplier_name: 'Supplier',
  season: '2026',
  year: 2026,
  status: 'DRAFT',
  compliance_status: 'PENDING',
  plots: [],
  farmers: [],
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-01T10:00:00.000Z',
  ...overrides,
});

describe('package-sla', () => {
  it('calculates SLA health thresholds', () => {
    expect(calculateSlaHealth(2, 7)).toBe('healthy');
    expect(calculateSlaHealth(6, 7)).toBe('warning');
    expect(calculateSlaHealth(8, 7)).toBe('overdue');
  });

  it('builds shipment SLA snapshots from package timestamps', () => {
    const packages = [
      basePackage({
        id: 'pkg-draft-old',
        status: 'DRAFT',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      basePackage({
        id: 'pkg-ready',
        status: 'READY',
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    const snapshots = buildShipmentSlaSnapshots(packages, {
      DRAFT: 1,
      READY: 1,
      SEALED: 0,
    });

    expect(snapshots.DRAFT.count).toBe(1);
    expect(snapshots.DRAFT.daysActive).toBe(8);
    expect(snapshots.DRAFT.health).toBe('overdue');
    expect(snapshots.READY.daysActive).toBe(2);
    expect(snapshots.READY.health).toBe('healthy');
  });

  it('uses created_at for draft age and submitted_at for submitted packages', () => {
    const draftPkg = basePackage({
      status: 'DRAFT',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const submittedPkg = basePackage({
      status: 'SUBMITTED',
      submitted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(daysInCurrentStatus(draftPkg)).toBe(6);
    expect(daysInCurrentStatus(submittedPkg)).toBe(4);
  });
});
