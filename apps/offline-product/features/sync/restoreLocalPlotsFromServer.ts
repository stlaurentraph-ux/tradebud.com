import type { Plot } from '@/features/state/AppStateContext';
import {
  backendRowMatchesLocalClientId,
  isServerOnlyDemoPlot,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';
import {
  mapServerPlotRowToLocalPlot,
  type ServerPlotRowForRestore,
} from '@/features/plots/localPlotFromServerGeometry';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadPlotServerLinks,
  persistPlots,
  savePlotServerLink,
} from '@/features/state/persistence';
import { reconcilePlotServerLinks } from '@/features/plots/plotServerLink';

export type RestoreLocalPlotsResult = {
  restoredCount: number;
  mergedPlots: Plot[];
  fetchFailed: boolean;
  skippedMissingGeometry: number;
};

function serverRowAlreadyOnDevice(
  row: BackendPlotRow,
  localPlots: readonly Plot[],
  plotServerLinks: Record<string, string>,
): boolean {
  const serverId = String(row.id ?? '').trim();
  if (!serverId) return true;

  for (const localPlot of localPlots) {
    if (plotServerLinks[localPlot.id]?.trim() === serverId) return true;
    if (backendRowMatchesLocalClientId(row, localPlot.id)) return true;
    if (localPlot.id === serverId) return true;
  }
  return false;
}

/** Dry-run: server plots Sync now would still pull (mirrors restore loop, skips demo/unmapped). */
export function countPendingServerPlotsRestore(params: {
  apiFarmerId: string;
  backendPlots: readonly unknown[];
  localPlots: readonly Plot[];
  plotServerLinks: Record<string, string>;
}): number {
  const apiFarmerId = params.apiFarmerId.trim();
  const localPlotIds = new Set(params.localPlots.map((plot) => plot.id));
  let pending = 0;

  for (const rawRow of params.backendPlots) {
    const row = rawRow as ServerPlotRowForRestore;
    if (isServerOnlyDemoPlot(row)) continue;
    if (serverRowAlreadyOnDevice(row, params.localPlots, params.plotServerLinks)) continue;

    const mapped = mapServerPlotRowToLocalPlot(row, apiFarmerId);
    if (!mapped || localPlotIds.has(mapped.id)) continue;
    pending += 1;
  }

  return pending;
}

/**
 * Pulls server plots missing on this device into local SQLite (Phase 1 cloud restore).
 * Never deletes or overwrites plots already stored locally.
 */
export async function restoreLocalPlotsFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<RestoreLocalPlotsResult> {
  const localPlots = [...params.localPlots];
  let plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;

  let backendPlots: unknown[] = [];
  let fetchFailed = false;
  try {
    backendPlots = await fetchBackendPlotsForSyncScope({
      farmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    });
  } catch {
    fetchFailed = true;
    return { restoredCount: 0, mergedPlots: localPlots, fetchFailed, skippedMissingGeometry: 0 };
  }

  const localPlotIds = new Set(localPlots.map((plot) => plot.id));
  const restoredPlots: Plot[] = [];
  let skippedMissingGeometry = 0;

  for (const rawRow of backendPlots) {
    const row = rawRow as ServerPlotRowForRestore;
    if (isServerOnlyDemoPlot(row)) continue;
    if (serverRowAlreadyOnDevice(row, localPlots, plotServerLinks)) continue;

    const mapped = mapServerPlotRowToLocalPlot(row, params.apiFarmerId);
    if (!mapped) {
      skippedMissingGeometry += 1;
      continue;
    }
    if (localPlotIds.has(mapped.id)) continue;

    localPlotIds.add(mapped.id);
    restoredPlots.push(mapped);
    const serverId = String(row.id ?? '').trim();
    if (serverId) {
      plotServerLinks = { ...plotServerLinks, [mapped.id]: serverId };
    }
  }

  if (restoredPlots.length === 0) {
    return {
      restoredCount: 0,
      mergedPlots: localPlots,
      fetchFailed,
      skippedMissingGeometry,
    };
  }

  const mergedPlots = [...localPlots, ...restoredPlots];
  plotServerLinks = reconcilePlotServerLinks(mergedPlots, backendPlots, plotServerLinks);

  await persistPlots(mergedPlots);
  for (const plot of restoredPlots) {
    const serverId = plotServerLinks[plot.id]?.trim();
    if (serverId) {
      await savePlotServerLink(plot.id, serverId).catch(() => undefined);
    }
  }

  return {
    restoredCount: restoredPlots.length,
    mergedPlots,
    fetchFailed,
    skippedMissingGeometry,
  };
}
