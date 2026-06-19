import type { Plot } from '@/features/state/AppStateContext';
import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import { listUnsyncedLocalPlots } from '@/features/sync/plotServerSync';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';

export type TotalSyncPendingSnapshot = {
  queuePendingCount: number;
  unsyncedPlotCount: number;
  total: number;
};

/** Queue rows + local plots missing on server (same math as Home / Settings backup card). */
export async function measureTotalSyncPending(params: {
  farmerId?: string;
  /** Merges server plots from every owned profile (auth uid vs linked farmer id). */
  ownedFarmerIds?: string[];
  plots: Plot[];
  isSignedIn: boolean;
}): Promise<TotalSyncPendingSnapshot> {
  await compactDuplicatePendingSyncActions().catch(() => 0);
  const rows = await loadPendingSyncActions().catch(() => []);

  let unsyncedPlotCount = 0;
  if (params.isSignedIn && params.farmerId && params.plots.length > 0) {
    const plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
    try {
      const backend = await fetchServerPlotListForUi({
        profileFarmerId: params.farmerId,
        localPlots: params.plots,
        ownedFarmerIds: params.ownedFarmerIds,
      });
      unsyncedPlotCount = listUnsyncedLocalPlots(
        params.plots,
        backend ?? [],
        plotServerLinks,
      ).length;
    } catch {
      unsyncedPlotCount = listUnsyncedLocalPlots(
        params.plots,
        [],
        plotServerLinks,
      ).length;
    }
  }

  const queuePendingCount = rows.length;
  return {
    queuePendingCount,
    unsyncedPlotCount,
    total: queuePendingCount + unsyncedPlotCount,
  };
}
