import type { Plot } from '@/features/state/AppStateContext';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
import {
  processPendingSyncQueue,
  type ProcessPendingSyncQueueResult,
} from '@/features/sync/processPendingSyncQueue';
import {
  uploadUnsyncedPlotsForFarmer,
  type UploadUnsyncedPlotsResult,
} from '@/features/sync/plotServerSync';
import { withSyncQueueLock } from '@/features/sync/syncQueueMutex';

const QUEUE_ACTION_TYPES = ['harvest', 'photos_sync', 'evidence_sync'] as const;

export type RunAutoBackupResult = {
  plotResult: UploadUnsyncedPlotsResult | null;
  queueResult: ProcessPendingSyncQueueResult;
};

/** Upload unsynced plots and drain the offline queue (harvests, photos, documents). */
export async function runAutoBackup(params: {
  farmerId: string;
  localPlots: Plot[];
}): Promise<RunAutoBackupResult> {
  return withSyncQueueLock(async () => {
    let plotResult: UploadUnsyncedPlotsResult | null = null;
    if (params.localPlots.length > 0) {
      plotResult = await uploadUnsyncedPlotsForFarmer({
        farmerId: params.farmerId,
        localPlots: params.localPlots,
      });
    }
    await processPendingConsentQueue();
    const queueResult = await processPendingSyncQueue({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
      actionTypes: [...QUEUE_ACTION_TYPES],
      attemptScope: 'all',
    });
    return { plotResult, queueResult };
  });
}
