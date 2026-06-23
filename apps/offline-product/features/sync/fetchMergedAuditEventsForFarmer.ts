import { fetchAuditForFarmer } from '@/features/api/audit';

export type AuditLogRow = {
  id?: string;
  timestamp?: string;
  event_type?: string;
  payload?: Record<string, unknown>;
};

function uniqueIds(candidates: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of candidates) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

/** Merge audit rows across owned farmer ids (newest first). */
export async function fetchMergedAuditEventsForFarmer(
  farmerIds: string[],
  limit = 200,
  eventTypes?: readonly string[],
): Promise<AuditLogRow[]> {
  const typeFilter =
    eventTypes && eventTypes.length > 0 ? new Set(eventTypes.map((t) => t.trim())) : null;
  const seen = new Set<string>();
  const merged: AuditLogRow[] = [];
  let lastError: unknown = null;
  let attemptCount = 0;

  for (const farmerId of uniqueIds(farmerIds)) {
    try {
      attemptCount += 1;
      const rows = (await fetchAuditForFarmer(farmerId)) as AuditLogRow[];
      const slice = Array.isArray(rows) ? rows.slice(0, limit) : [];
      for (const row of slice) {
        if (typeFilter && !typeFilter.has(String(row.event_type ?? '').trim())) continue;
        const id = String(row?.id ?? `${row.event_type}:${row.timestamp}`).trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(row);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (merged.length === 0 && attemptCount > 0 && lastError != null) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  merged.sort((a, b) => {
    const aMs = Date.parse(String(a.timestamp ?? '')) || 0;
    const bMs = Date.parse(String(b.timestamp ?? '')) || 0;
    return bMs - aMs;
  });

  return merged.slice(0, limit);
}
