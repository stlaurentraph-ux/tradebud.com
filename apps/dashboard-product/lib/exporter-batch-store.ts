export interface ExporterBatchRecord {
  id: string;
  batch_id: string;
  plot_id: string;
  plot_name: string;
  plot_area_hectares: number;
  farmer_name: string;
  weight_kg: number;
  expected_yield_kg_per_ha: number;
  date: string;
  status: 'pass' | 'warning' | 'blocked';
  exception_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

function storageKey(tenantId: string): string {
  return `tracebud_exporter_batches_${tenantId}`;
}

export function deriveBatchStatus(
  weightKg: number,
  areaHa: number,
  expectedYieldKgPerHa: number,
): 'pass' | 'warning' | 'blocked' {
  const capacity = areaHa * expectedYieldKgPerHa;
  if (capacity <= 0) return 'pass';
  const ratio = weightKg / capacity;
  if (ratio > 1.1) return 'blocked';
  if (ratio > 1.0) return 'warning';
  return 'pass';
}

export function loadExporterBatches(tenantId: string): ExporterBatchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExporterBatchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExporterBatch(tenantId: string, batch: ExporterBatchRecord): ExporterBatchRecord[] {
  const existing = loadExporterBatches(tenantId);
  const next = [batch, ...existing.filter((item) => item.id !== batch.id)];
  window.localStorage.setItem(storageKey(tenantId), JSON.stringify(next));
  return next;
}
