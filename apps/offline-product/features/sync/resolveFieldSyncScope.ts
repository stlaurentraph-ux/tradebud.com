import {
  bootstrapFieldAppProducer,
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
} from '@/features/api/fieldAppBootstrap';
import { fetchPlotsForFarmerCached } from '@/features/sync/serverPlotFetchCache';
import type { Plot } from '@/features/state/AppStateContext';
import {
  adoptOnDeviceFarmerScope,
  repairPendingSyncPayloadFarmerIds,
  rekeyFarmerIdInDatabase,
} from '@/features/state/persistence';

export type FieldSyncScope = {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  serverPlotCount: number;
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

/** Merges plot rows from every farmer id the signed-in user may access. */
export async function fetchMergedServerPlots(farmerIds: string[]): Promise<unknown[]> {
  const seen = new Set<string>();
  const merged: unknown[] = [];
  for (const farmerId of farmerIds) {
    try {
      const rows = (await fetchPlotsForFarmerCached(farmerId)) as { id?: unknown }[];
      for (const row of rows ?? []) {
        const id = String(row?.id ?? '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(row);
      }
    } catch {
      // try next owned profile
    }
  }
  return merged;
}

/** Single entry for sync UI + upload: merged list when multiple owned profiles exist. */
export async function fetchBackendPlotsForSyncScope(params: {
  farmerId: string;
  ownedFarmerIds?: string[];
}): Promise<unknown[]> {
  const scopeIds = uniqueIds([params.farmerId, ...(params.ownedFarmerIds ?? [])]);
  if (scopeIds.length > 1) {
    return fetchMergedServerPlots(scopeIds);
  }
  const farmerId = params.farmerId.trim();
  if (!farmerId) return [];
  return (await fetchPlotsForFarmerCached(farmerId)) ?? [];
}

/**
 * Resolves which farmer id owns server plots for sync (device id vs linked profile id).
 */
export async function resolveFieldSyncScope(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<FieldSyncScope> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) {
    return { apiFarmerId: profileFarmerId, ownedFarmerIds: [], serverPlotCount: 0 };
  }

  await bootstrapFieldAppProducer({ farmerId: profileFarmerId }).catch(() => undefined);

  const ownedFarmerIds = uniqueIds([
    ...(await fetchOwnedFarmerIdsFromApi()),
    ...getBootstrapOwnedFarmerIds(),
    profileFarmerId,
    ...params.localPlots.map((plot) => plot.farmerId ?? ''),
  ]);

  let apiFarmerId = profileFarmerId;
  let bestPlotCount = -1;
  const mergedSeen = new Set<string>();
  const merged: unknown[] = [];

  for (const farmerId of ownedFarmerIds) {
    try {
      const rows = (await fetchPlotsForFarmerCached(farmerId)) as { id?: unknown }[];
      const count = rows?.length ?? 0;
      if (count > bestPlotCount) {
        bestPlotCount = count;
        apiFarmerId = farmerId;
      }
      for (const row of rows ?? []) {
        const id = String(row?.id ?? '').trim();
        if (!id || mergedSeen.has(id)) continue;
        mergedSeen.add(id);
        merged.push(row);
      }
    } catch {
      // try next owned profile
    }
  }

  const mergedPlotCount = merged.length;
  const serverPlotCount = Math.max(bestPlotCount, mergedPlotCount);

  return {
    apiFarmerId: serverPlotCount > 0 ? apiFarmerId : profileFarmerId,
    ownedFarmerIds,
    serverPlotCount,
  };
}

/** Picks the farmer id that can list server plots for sync (auth uid vs device profile id). */
export async function resolveFieldApiFarmerId(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<string> {
  const scope = await resolveFieldSyncScope(params);
  return scope.apiFarmerId;
}

export type PreparedFieldSyncContext = {
  farmerId: string;
  ownedFarmerIds: string[];
  rekeyed: boolean;
};

/** Resolve API farmer scope and align on-device farmer id when the linked profile owns server plots. */
export async function prepareFieldSyncContext(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<PreparedFieldSyncContext> {
  const scope = await resolveFieldSyncScope(params);
  const { farmerId, rekeyed } = await applyCanonicalFarmerScopeIfNeeded({
    profileFarmerId: params.profileFarmerId,
    apiFarmerId: scope.apiFarmerId,
    serverPlotCount: scope.serverPlotCount,
  });
  return {
    farmerId,
    ownedFarmerIds: scope.ownedFarmerIds,
    rekeyed,
  };
}

/**
 * When the linked server profile differs from the on-device farmer id, rekey local data
 * so plot upload and harvest queue use the profile that already owns server plots.
 */
export async function applyCanonicalFarmerScopeIfNeeded(params: {
  profileFarmerId: string;
  apiFarmerId: string;
  serverPlotCount: number;
}): Promise<{ farmerId: string; rekeyed: boolean }> {
  const profileFarmerId = params.profileFarmerId.trim();
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { farmerId: profileFarmerId, rekeyed: false };
  }

  await repairPendingSyncPayloadFarmerIds(apiFarmerId, profileFarmerId).catch(() => 0);

  if (apiFarmerId === profileFarmerId) {
    return { farmerId: apiFarmerId, rekeyed: false };
  }

  if (params.serverPlotCount <= 0) {
    return { farmerId: profileFarmerId, rekeyed: false };
  }

  try {
    await rekeyFarmerIdInDatabase(profileFarmerId, apiFarmerId);
    await adoptOnDeviceFarmerScope(apiFarmerId).catch(() => false);
    return { farmerId: apiFarmerId, rekeyed: true };
  } catch {
    // Local SQLite rekey can fail (e.g. id collision); still sync under linked profile id.
    return { farmerId: apiFarmerId, rekeyed: false };
  }
}
