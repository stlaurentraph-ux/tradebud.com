import type { Plot } from '@/features/state/AppStateContext';
import { recordDataProcessingConsent } from '@/features/compliance/dataProcessingConsent';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { runAutoBackup, type RunAutoBackupResult } from '@/features/sync/runAutoBackup';

export async function runBackupWithConsent(params: {
  farmerId: string;
  localPlots: Plot[];
}): Promise<RunAutoBackupResult | null> {
  if (!params.farmerId) {
    return null;
  }
  const consentAt = await recordDataProcessingConsent();
  trackEvent(ANALYTICS_EVENTS.DATA_PROCESSING_CONSENT_ACCEPTED, { consentAt });
  const result = await runAutoBackup({
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });
  if (result.plotResult && result.plotResult.uploaded > 0) {
    trackEvent(ANALYTICS_EVENTS.BACKUP_CONFIRMED, {
      uploaded: result.plotResult.uploaded,
      failed: result.plotResult.failed,
    });
  }
  if (result.queueResult.completed > 0) {
    trackEvent(ANALYTICS_EVENTS.SYNC_QUEUE_DRAINED, {
      completed: result.queueResult.completed,
      failedActions: result.queueResult.failedActions,
      droppedInvalid: result.queueResult.droppedInvalid,
      source: 'backup_consent',
    });
  }
  return result;
}
