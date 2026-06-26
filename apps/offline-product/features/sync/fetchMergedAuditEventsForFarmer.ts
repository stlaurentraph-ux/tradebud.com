import { fetchAuditForFarmer } from '@/features/api/audit';

export type AuditLogRow = {
  id?: string;
  timestamp?: string;
  event_type?: string;
  payload?: Record<string, unknown>;
};

/** Align with focus-restore debounce so parallel restore steps share one fetch burst. */
const AUDIT_FETCH_CACHE_TTL_MS = 30_000;

type FarmerAuditCacheEntry = {
  at: number;
  rows: AuditLogRow[];
};

const farmerAuditCache = new Map<string, FarmerAuditCacheEntry>();
const farmerAuditInflight = new Map<string, Promise<AuditLogRow[]>>();

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

/** Test hook — clears TTL + in-flight dedupe state. */
export function resetAuditFetchCacheForTests(): void {
  farmerAuditCache.clear();
  farmerAuditInflight.clear();
}

/** Call after a successful audit POST when readers need fresh rows immediately. */
export function invalidateAuditFetchCache(): void {
  farmerAuditCache.clear();
}

async function fetchAuditRowsForFarmerCached(farmerId: string): Promise<AuditLogRow[]> {
  const id = farmerId.trim();
  if (!id) return [];

  const now = Date.now();
  const cached = farmerAuditCache.get(id);
  if (cached && now - cached.at < AUDIT_FETCH_CACHE_TTL_MS) {
    return cached.rows;
  }

  let inflight = farmerAuditInflight.get(id);
  if (!inflight) {
    inflight = (async () => {
      try {
        const rows = (await fetchAuditForFarmer(id)) as AuditLogRow[];
        const normalized = Array.isArray(rows) ? rows : [];
        farmerAuditCache.set(id, { at: Date.now(), rows: normalized });
        return normalized;
      } finally {
        farmerAuditInflight.delete(id);
      }
    })();
    farmerAuditInflight.set(id, inflight);
  }

  return inflight;
}

function filterAndSliceRows(
  rows: AuditLogRow[],
  limit: number,
  eventTypes?: readonly string[],
): AuditLogRow[] {
  const typeFilter =
    eventTypes && eventTypes.length > 0 ? new Set(eventTypes.map((t) => t.trim())) : null;
  const seen = new Set<string>();
  const merged: AuditLogRow[] = [];

  for (const row of rows) {
    if (typeFilter && !typeFilter.has(String(row.event_type ?? '').trim())) continue;
    const rowId = String(row?.id ?? `${row.event_type}:${row.timestamp}`).trim();
    if (!rowId || seen.has(rowId)) continue;
    seen.add(rowId);
    merged.push(row);
  }

  merged.sort((a, b) => {
    const aMs = Date.parse(String(a.timestamp ?? '')) || 0;
    const bMs = Date.parse(String(b.timestamp ?? '')) || 0;
    return bMs - aMs;
  });

  return merged.slice(0, limit);
}

/** Merge audit rows across owned farmer ids (newest first). */
export async function fetchMergedAuditEventsForFarmer(
  farmerIds: string[],
  limit = 200,
  eventTypes?: readonly string[],
): Promise<AuditLogRow[]> {
  const ids = uniqueIds(farmerIds);
  if (ids.length === 0) return [];

  const merged: AuditLogRow[] = [];
  let lastError: unknown = null;
  let attemptCount = 0;

  for (const farmerId of ids) {
    try {
      attemptCount += 1;
      const rows = await fetchAuditRowsForFarmerCached(farmerId);
      merged.push(...rows);
    } catch (error) {
      lastError = error;
    }
  }

  if (merged.length === 0 && attemptCount > 0 && lastError != null) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  return filterAndSliceRows(merged, limit, eventTypes);
}
