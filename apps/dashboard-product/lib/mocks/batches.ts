import type { ExporterBatchRecord } from '@/lib/exporter-batch-store';

/** Demo batches aligned with `/harvests` list rows (harv_001–003). */
export const mockBatches: ExporterBatchRecord[] = [
  {
    id: 'harv_001',
    batch_id: 'BATCH-2026-041',
    plot_id: 'plot_117',
    plot_name: 'Nyota Block A',
    plot_area_hectares: 1.8,
    farmer_name: 'Amina N.',
    weight_kg: 1280,
    expected_yield_kg_per_ha: 700,
    date: '2026-04-18T09:30:00.000Z',
    status: 'warning',
    exception_status: 'pending',
  },
  {
    id: 'harv_002',
    batch_id: 'BATCH-2026-042',
    plot_id: 'plot_241',
    plot_name: 'Kijani Ridge',
    plot_area_hectares: 2.3,
    farmer_name: 'Daniel K.',
    weight_kg: 1410,
    expected_yield_kg_per_ha: 700,
    date: '2026-04-19T10:15:00.000Z',
    status: 'pass',
    exception_status: 'none',
  },
  {
    id: 'harv_003',
    batch_id: 'BATCH-2026-043',
    plot_id: 'plot_322',
    plot_name: 'Valley Group Lot 7',
    plot_area_hectares: 1.2,
    farmer_name: 'Coop Cluster 7',
    weight_kg: 980,
    expected_yield_kg_per_ha: 700,
    date: '2026-04-20T08:05:00.000Z',
    status: 'blocked',
    exception_status: 'none',
  },
];

export function listMockBatches(): ExporterBatchRecord[] {
  return mockBatches;
}

export function getMockBatchById(lookupId: string): ExporterBatchRecord | null {
  const normalized = lookupId.trim();
  if (!normalized) return null;
  return (
    mockBatches.find((batch) => batch.id === normalized) ??
    mockBatches.find((batch) => batch.batch_id === normalized) ??
    null
  );
}
