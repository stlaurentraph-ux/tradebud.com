import type { Plot } from '@/features/state/AppStateContext';
import {
  fetchBackendPlotsForSyncScope,
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';

/** Shared TTL for Home / Plots / Settings / Harvests server plot list reads. */
export const SERVER_PLOT_LIST_UI_TTL_MS = 3 * 60 * 1000;

type CacheEntry = {
  at: number;
  rows: unknown[];
};

const cache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();

function scopeCacheKey(farmerId: string, ownedFarmerIds: readonly string[]): string {
  const owned = [...new Set(ownedFarmerIds.map((id) => id.trim()).filter(Boolean))].sort();
  return owned.length > 0 ? `${farmerId}|${owned.join(',')}` : farmerId;
}

export function invalidateServerPlotListCache(): void {
  if (cache.size === 0) return;
  cache.clear();
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export function subscribeServerPlotListCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function peekServerPlotListCache(params: {
  farmerId: string;
  ownedFarmerIds?: readonly string[];
}): unknown[] | null {
  const farmerId = params.farmerId.trim();
  if (!farmerId) return null;
  const key = scopeCacheKey(farmerId, params.ownedFarmerIds ?? []);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > SERVER_PLOT_LIST_UI_TTL_MS) return null;
  return entry.rows;
}

/**
 * Scope-aware plot list for UI tabs. Uses a cross-screen TTL cache so focus
 * changes do not re-fetch on every navigation.
 */
export async function fetchServerPlotListForUi(params: {
  profileFarmerId: string;
  localPlots?: Plot[];
  ownedFarmerIds?: string[];
  force?: boolean;
}): Promise<unknown[]> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) return [];

  let farmerId = profileFarmerId;
  let ownedFarmerIds = params.ownedFarmerIds ?? [];
  if (params.localPlots != null) {
    const syncContext = await prepareFieldSyncContext({
      profileFarmerId,
      localPlots: params.localPlots,
    });
    farmerId = syncContext.farmerId;
    ownedFarmerIds = syncContext.ownedFarmerIds;
  }

  const key = scopeCacheKey(farmerId, ownedFarmerIds);
  if (!params.force) {
    const cached = peekServerPlotListCache({ farmerId, ownedFarmerIds });
    if (cached) return cached;
  }

  const rows =
    (await fetchBackendPlotsForSyncScope({
      farmerId,
      ownedFarmerIds,
    })) ?? [];
  cache.set(key, { at: Date.now(), rows });
  return rows;
}
