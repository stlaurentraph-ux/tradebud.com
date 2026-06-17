import type { ExporterBatchRecord } from '@/lib/exporter-batch-store';
import { loadExporterBatches, saveExporterBatch } from '@/lib/exporter-batch-store';

const BATCH_EVENT_TYPE = 'dashboard_batch_intake_recorded';

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function auditRowToBatch(row: {
  id: string | number;
  timestamp: string;
  payload?: Record<string, unknown>;
}): ExporterBatchRecord | null {
  const batch = row.payload?.batch;
  if (!batch || typeof batch !== 'object') return null;
  const record = batch as ExporterBatchRecord;
  if (!record.id || !record.batch_id) return null;
  return {
    ...record,
    date: record.date ?? row.timestamp,
  };
}

export async function listBatchIntakes(tenantId: string): Promise<ExporterBatchRecord[]> {
  const localBatches = loadExporterBatches(tenantId);

  try {
    const response = await fetch(
      `/api/harvest/batch-intakes?tenantId=${encodeURIComponent(tenantId)}`,
      { cache: 'no-store', headers: getAuthHeaders() },
    );
    if (!response.ok) {
      return localBatches;
    }
    const body = (await response.json()) as { batches?: ExporterBatchRecord[] };
    const remoteBatches = Array.isArray(body.batches) ? body.batches : [];
    const merged = [...remoteBatches, ...localBatches];
    const seen = new Set<string>();
    return merged.filter((batch) => {
      if (seen.has(batch.id)) return false;
      seen.add(batch.id);
      return true;
    });
  } catch {
    return localBatches;
  }
}

export async function getBatchIntakeById(
  tenantId: string,
  lookupId: string,
): Promise<ExporterBatchRecord | null> {
  const normalized = lookupId.trim();
  if (!normalized) return null;
  const batches = await listBatchIntakes(tenantId);
  return (
    batches.find((batch) => batch.id === normalized) ??
    batches.find((batch) => batch.batch_id === normalized) ??
    null
  );
}

export async function recordBatchIntake(
  tenantId: string,
  batch: ExporterBatchRecord,
): Promise<{ persistedRemotely: boolean; batches: ExporterBatchRecord[] }> {
  const localBatches = saveExporterBatch(tenantId, batch);

  try {
    const response = await fetch('/api/harvest/batch-intakes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() ?? {}),
      },
      body: JSON.stringify({ tenantId, batch }),
    });

    if (!response.ok) {
      return { persistedRemotely: false, batches: localBatches };
    }

    const body = (await response.json()) as { batches?: ExporterBatchRecord[] };
    return {
      persistedRemotely: true,
      batches: Array.isArray(body.batches) ? body.batches : localBatches,
    };
  } catch {
    return { persistedRemotely: false, batches: localBatches };
  }
}

export { BATCH_EVENT_TYPE, auditRowToBatch };
