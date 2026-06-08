// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { deriveBatchStatus, loadExporterBatches, saveExporterBatch } from './exporter-batch-store';

describe('exporter-batch-store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('derives batch status from yield capacity', () => {
    expect(deriveBatchStatus(700, 1, 700)).toBe('pass');
    expect(deriveBatchStatus(750, 1, 700)).toBe('warning');
    expect(deriveBatchStatus(800, 1, 700)).toBe('blocked');
  });

  it('persists exporter batches per tenant', () => {
    const batch = {
      id: 'batch_1',
      batch_id: 'BATCH-2026-001',
      plot_id: 'plot_1',
      plot_name: 'Plot A',
      plot_area_hectares: 2,
      farmer_name: 'Producer A',
      weight_kg: 1200,
      expected_yield_kg_per_ha: 700,
      date: new Date().toISOString(),
      status: 'pass' as const,
    };

    saveExporterBatch('tenant_1', batch);
    expect(loadExporterBatches('tenant_1')).toHaveLength(1);
    expect(loadExporterBatches('tenant_2')).toHaveLength(0);
  });
});
