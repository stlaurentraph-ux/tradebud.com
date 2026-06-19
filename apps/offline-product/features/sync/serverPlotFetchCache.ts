import { fetchPlotsForFarmer } from '@/features/api/postPlot';

/**
 * Per-run de-duplication for `GET /v1/plots?farmerId=…`.
 *
 * A single "Sync now" used to fan out ~16 identical plot fetches across scope
 * resolution, link warming, plot upload, every queue pass, and the post-run
 * pending count. That burst is the documented production 429 root cause and it
 * also made local↔server link establishment non-deterministic (one fetch could
 * be rate-limited while another succeeded). Wrapping a sync run with
 * `beginServerPlotFetchRun()` / `endServerPlotFetchRun()` collapses those reads
 * to one network call per farmer id for the lifetime of the run.
 *
 * Outside an open run the helper is a transparent pass-through, so non-sync
 * callers keep their previous fetch-every-time behaviour.
 */

type CacheEntry = { at: number; rows: unknown[] };

const CACHE_TTL_MS = 12_000;

let runDepth = 0;
const cache = new Map<string, CacheEntry>();

/** Open a caching window. Reentrant: nested runs share one cache and one close. */
export function beginServerPlotFetchRun(): void {
  if (runDepth === 0) {
    cache.clear();
  }
  runDepth += 1;
}

/** Close the caching window opened by `beginServerPlotFetchRun`. */
export function endServerPlotFetchRun(): void {
  runDepth = Math.max(0, runDepth - 1);
  if (runDepth === 0) {
    cache.clear();
  }
}

/** Drop cached lists after the server state changes (plot upload, manual refresh). */
export function invalidateServerPlotFetchCache(): void {
  cache.clear();
}

export function isServerPlotFetchRunActive(): boolean {
  return runDepth > 0;
}

/**
 * `fetchPlotsForFarmer` with per-run de-duplication. Errors are never cached so
 * a transient 403/timeout for one farmer id does not poison later passes.
 */
export async function fetchPlotsForFarmerCached(farmerId: string): Promise<unknown[]> {
  const id = farmerId.trim();
  if (!id) return [];

  if (runDepth <= 0) {
    return (await fetchPlotsForFarmer(id)) ?? [];
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.rows;
  }

  const rows = (await fetchPlotsForFarmer(id)) ?? [];
  cache.set(id, { at: Date.now(), rows });
  return rows;
}
