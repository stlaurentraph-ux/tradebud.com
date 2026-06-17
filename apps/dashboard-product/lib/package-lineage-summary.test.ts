import { describe, expect, it } from 'vitest';
import { buildPackageLineageSummary } from './package-lineage-summary';
import type { DDSPackage } from '@/types';

const basePackage: DDSPackage = {
  id: 'pkg-1',
  code: 'BATCH-001',
  supplier_name: 'Coop A',
  season: 'Main',
  year: 2026,
  status: 'DRAFT',
  compliance_status: 'PENDING',
  plots: [
    {
      id: 'plot-1',
      name: 'Plot 1',
      area_hectares: 2.5,
      deforestation_risk: 'low',
      verified: true,
      farmer_id: 'farmer-1',
      evidence: [],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  farmers: [
    {
      id: 'farmer-1',
      name: 'Producer 1',
      plots: [],
      fpic_signed: true,
      labor_compliant: true,
      verified: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  total_weight_kg: 1200,
};

describe('buildPackageLineageSummary', () => {
  it('reports intact lineage when producers and plots are linked', () => {
    const summary = buildPackageLineageSummary(basePackage);
    expect(summary.isIntact).toBe(true);
    expect(summary.producerCount).toBe(1);
    expect(summary.plotCount).toBe(1);
    expect(summary.weightKg).toBe(1200);
    expect(summary.totalHectares).toBe(2.5);
  });

  it('flags missing upstream associations', () => {
    const summary = buildPackageLineageSummary({
      ...basePackage,
      farmers: [],
      plots: [],
    });
    expect(summary.isIntact).toBe(false);
    expect(summary.missingProducers).toBe(true);
    expect(summary.missingPlots).toBe(true);
  });
});
