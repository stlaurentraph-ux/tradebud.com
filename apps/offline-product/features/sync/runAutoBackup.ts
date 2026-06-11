import type { Plot } from '@/features/state/AppStateContext';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
import { processPendingSyncQueue } from '@/features/sync/processPendingSyncQueue';
import { uploadUnsyncedPlotsForFarmer } from '@/features/sync/plotServerSync';

const QUEUE_ACTION_TYPES = ['harvest', 'photos_sync', 'evidence_sync'] as const;

/** Upload unsynced plots and drain the offline queue (harvests, photos, documents). */
export async function runAutoBackup(params: { farmerId: string; localPlots: Plot[] }) {
  await uploadUnsyncedPlotsForFarmer({
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });
  await processPendingConsentQueue();
  await processPendingSyncQueue({
    farmerId: params.farmerId,
    localPlots: params.localPlots,
    actionTypes: [...QUEUE_ACTION_TYPES],
    attemptScope: 'all',
  });
}
