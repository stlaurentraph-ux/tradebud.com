import type { Plot } from '@/features/state/AppStateContext';
import {
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
} from '@/features/api/fieldAppBootstrap';
import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
} from '@/features/state/persistence';
import { createTranslator } from '@/features/i18n/translate';
import { defaultLocale } from '@/features/i18n/config';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';
import { invalidateServerPlotFetchCache } from '@/features/sync/serverPlotFetchCache';
import {
  fetchBackendPlotsForSyncScope,
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';
import { reconcilePlotServerLinks } from '@/features/plots/plotServerLink';
import {
  classifyLocalPlotSyncPending,
  summarizePlotSyncPending,
  type PlotSyncBlockInfo,
} from '@/features/sync/plotSyncPending';
import { isPlotFetchReachabilityFailure } from '@/features/sync/plotFetchFailure';

export type TotalSyncPendingSnapshot = {
  queuePendingCount: number;
  /** Plots missing on the server (excludes geometry-blocked and already-synced plots). */
  unsyncedPlotCount: number;
  blockedPlotCount: number;
  total: number;
  unsyncedPlotNames: string[];
  blockedPlots: PlotSyncBlockInfo[];
  /** Server plot list could not be loaded — counts may rely on saved links only. */
  plotsFetchFailed?: boolean;
  /** Merged server rows used for the pending count (Settings display). */
  backendPlots?: unknown[];
  /** Reconciled local↔server links after the measurement pass. */
  plotServerLinks?: Record<string, string>;
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

async function resolvePlotSyncScope(params: {
  profileFarmerId: string;
  localPlots: Plot[];
  ownedFarmerIds?: string[];
}): Promise<{ apiFarmerId: string; ownedFarmerIds: string[] }> {
  const profileFarmerId = params.profileFarmerId.trim();
  const preset = params.ownedFarmerIds ?? [];
  if (preset.length > 0) {
    return { apiFarmerId: profileFarmerId, ownedFarmerIds: preset };
  }

  try {
    const scope = await prepareFieldSyncContext({
      profileFarmerId,
      localPlots: params.localPlots,
    });
    return { apiFarmerId: scope.farmerId, ownedFarmerIds: scope.ownedFarmerIds };
  } catch {
    const ownedFarmerIds = uniqueIds([
      ...(await fetchOwnedFarmerIdsFromApi().catch(() => [])),
      ...getBootstrapOwnedFarmerIds(),
      profileFarmerId,
      ...params.localPlots.map((plot) => plot.farmerId ?? ''),
    ]);
    return { apiFarmerId: profileFarmerId, ownedFarmerIds };
  }
}

/** Queue rows + local plots that still need farmer attention on the server. */
export async function measureTotalSyncPending(params: {
  farmerId?: string;
  /** Merges server plots from every owned profile (auth uid vs linked farmer id). */
  ownedFarmerIds?: string[];
  plots: Plot[];
  isSignedIn: boolean;
  /** Bypass the UI TTL cache — use after Sync now or plot uploads. */
  forcePlotFetch?: boolean;
}): Promise<TotalSyncPendingSnapshot> {
  await compactDuplicatePendingSyncActions().catch(() => 0);
  const rows = await loadPendingSyncActions().catch(() => []);
  const t = createTranslator(defaultLocale);

  let unsyncedPlotCount = 0;
  let blockedPlotCount = 0;
  let unsyncedPlotNames: string[] = [];
  let blockedPlots: PlotSyncBlockInfo[] = [];
  let plotsFetchFailed = false;
  let backendPlots: unknown[] | undefined;
  let plotServerLinks: Record<string, string> | undefined;

  if (params.isSignedIn && params.farmerId && params.plots.length > 0) {
    if (params.forcePlotFetch) {
      invalidateServerPlotFetchCache();
      invalidateServerPlotListCache();
    }

    const profileFarmerId = params.farmerId.trim();
    const { apiFarmerId, ownedFarmerIds } = await resolvePlotSyncScope({
      profileFarmerId,
      localPlots: params.plots,
      ownedFarmerIds: params.ownedFarmerIds,
    });

    let links: Record<string, string> = await loadPlotServerLinks().catch(() => ({}));
    try {
      const backend =
        (await fetchBackendPlotsForSyncScope({
          farmerId: apiFarmerId,
          ownedFarmerIds,
        })) ?? [];
      backendPlots = backend;
      const reconciled = reconcilePlotServerLinks(params.plots, backend, links);
      const linksChanged =
        Object.keys(reconciled).length !== Object.keys(links).length ||
        Object.entries(reconciled).some(([localId, serverId]) => links[localId] !== serverId);
      if (linksChanged) {
        links = reconciled;
        await persistPlotServerLinks(reconciled).catch(() => undefined);
        invalidateServerPlotListCache();
      }
      plotServerLinks = links;
      const classified = classifyLocalPlotSyncPending({
        localPlots: params.plots,
        backendPlots: backend,
        plotServerLinks: links,
        t,
      });
      const summary = summarizePlotSyncPending(classified);
      unsyncedPlotCount = summary.needsUploadPlots.length;
      blockedPlotCount = summary.blockedPlots.length;
      unsyncedPlotNames = summary.unsyncedPlotNames;
      blockedPlots = summary.blockedPlots;
    } catch (err) {
      plotsFetchFailed = isPlotFetchReachabilityFailure(err);
      plotServerLinks = links;
      const classified = classifyLocalPlotSyncPending({
        localPlots: params.plots,
        backendPlots: [],
        plotServerLinks: links,
        t,
        trustPersistedLinksWithoutServer: true,
      });
      const summary = summarizePlotSyncPending(classified);
      unsyncedPlotCount = summary.needsUploadPlots.length;
      blockedPlotCount = summary.blockedPlots.length;
      unsyncedPlotNames = summary.unsyncedPlotNames;
      blockedPlots = summary.blockedPlots;
    }
  }

  const queuePendingCount = rows.length;
  const plotAttention = unsyncedPlotCount + blockedPlotCount;
  return {
    queuePendingCount,
    unsyncedPlotCount,
    blockedPlotCount,
    total: queuePendingCount + plotAttention,
    unsyncedPlotNames,
    blockedPlots,
    plotsFetchFailed,
    backendPlots,
    plotServerLinks,
  };
}
