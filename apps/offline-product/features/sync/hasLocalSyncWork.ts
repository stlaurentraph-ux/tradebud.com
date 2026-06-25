import type { Plot } from '@/features/state/AppStateContext';
import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import { createTranslator } from '@/features/i18n/translate';
import { defaultLocale } from '@/features/i18n/config';
import {
  classifyLocalPlotSyncPending,
  summarizePlotSyncPending,
} from '@/features/sync/plotSyncPending';

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
  const t = createTranslator(defaultLocale);
  const unsyncedPlotCount =
    params.plots.length > 0
      ? summarizePlotSyncPending(
          classifyLocalPlotSyncPending({
            localPlots: params.plots,
            backendPlots: [],
            plotServerLinks,
            t,
            trustPersistedLinksWithoutServer: true,
          }),
        ).needsUploadPlots.length
      : 0;
  const queuePendingCount = rows.length;
  return {
    queuePendingCount,
    unsyncedPlotCount,
    hasWork: queuePendingCount > 0 || unsyncedPlotCount > 0,
  };
}
