import type { Plot } from '@/features/state/AppStateContext';
import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import { listUnsyncedLocalPlots } from '@/features/sync/plotServerSync';

export type LocalSyncWorkSnapshot = {
  queuePendingCount: number;
  unsyncedPlotCount: number;
  hasWork: boolean;
};

/** Local-only pending check (no network) for background auto-backup gating. */
export async function measureLocalSyncWork(params: {
  plots: Plot[];
}): Promise<LocalSyncWorkSnapshot> {
  await compactDuplicatePendingSyncActions().catch(() => 0);
  const rows = await loadPendingSyncActions().catch(() => []);
  const plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
  const unsyncedPlotCount =
    params.plots.length > 0
      ? listUnsyncedLocalPlots(params.plots, [], plotServerLinks).length
      : 0;
  const queuePendingCount = rows.length;
  return {
    queuePendingCount,
    unsyncedPlotCount,
    hasWork: queuePendingCount > 0 || unsyncedPlotCount > 0,
  };
}
