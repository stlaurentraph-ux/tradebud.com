import type { Plot } from '@/features/state/AppStateContext';
import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
} from '@/features/state/persistence';
import { createTranslator } from '@/features/i18n/translate';
import { defaultLocale } from '@/features/i18n/config';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import { invalidateServerPlotFetchCache } from '@/features/sync/serverPlotFetchCache';
import { reconcilePlotServerLinks } from '@/features/plots/plotServerLink';
import {
  classifyLocalPlotSyncPending,
  summarizePlotSyncPending,
  type PlotSyncBlockInfo,
} from '@/features/sync/plotSyncPending';

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
};

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

  if (params.isSignedIn && params.farmerId && params.plots.length > 0) {
    if (params.forcePlotFetch) {
      invalidateServerPlotFetchCache();
    }
    let plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
    try {
      const backend = await fetchServerPlotListForUi({
        profileFarmerId: params.farmerId,
        localPlots: params.plots,
        ownedFarmerIds: params.ownedFarmerIds,
        resolvedFarmerId: params.farmerId,
        force: params.forcePlotFetch === true,
      });
      const reconciled = reconcilePlotServerLinks(params.plots, backend ?? [], plotServerLinks);
      if (
        Object.keys(reconciled).length !== Object.keys(plotServerLinks).length ||
        Object.entries(reconciled).some(([localId, serverId]) => plotServerLinks[localId] !== serverId)
      ) {
        plotServerLinks = reconciled;
        await persistPlotServerLinks(reconciled).catch(() => undefined);
      }
      const classified = classifyLocalPlotSyncPending({
        localPlots: params.plots,
        backendPlots: backend ?? [],
        plotServerLinks,
        t,
      });
      const summary = summarizePlotSyncPending(classified);
      unsyncedPlotCount = summary.needsUploadPlots.length;
      blockedPlotCount = summary.blockedPlots.length;
      unsyncedPlotNames = summary.unsyncedPlotNames;
      blockedPlots = summary.blockedPlots;
    } catch {
      plotsFetchFailed = true;
      const classified = classifyLocalPlotSyncPending({
        localPlots: params.plots,
        backendPlots: [],
        plotServerLinks,
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
  };
}
