// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PackageLineageSummaryCard } from './package-lineage-summary-card';
import type { DDSPackage } from '@/types';

const pkg: DDSPackage = {
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
      area_hectares: 1.2,
      deforestation_risk: 'low',
      verified: false,
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
  total_weight_kg: 500,
};

describe('PackageLineageSummaryCard', () => {
  it('renders intact lineage summary for exporter package detail', () => {
    render(<PackageLineageSummaryCard pkg={pkg} />);
    expect(screen.getByText('Lineage summary')).toBeInTheDocument();
    expect(screen.getByText(/Lineage intact/i)).toBeInTheDocument();
    expect(screen.getByText('Producer → plot → batch')).toBeInTheDocument();
  });

  it('surfaces missing upstream associations', () => {
    render(
      <PackageLineageSummaryCard
        pkg={{
          ...pkg,
          farmers: [],
          plots: [],
        }}
      />,
    );
    expect(screen.getByText(/Producers and plots are missing/i)).toBeInTheDocument();
  });
});
