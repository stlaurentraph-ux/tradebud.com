import type { Plot } from '@/features/state/AppStateContext';
import { recordDataProcessingConsent } from '@/features/compliance/dataProcessingConsent';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  uploadUnsyncedPlotsForFarmer,
  type UploadUnsyncedPlotsResult,
} from '@/features/sync/plotServerSync';

export async function runBackupWithConsent(params: {
  farmerId: string;
  localPlots: Plot[];
}): Promise<UploadUnsyncedPlotsResult | null> {
  if (!params.farmerId) {
    return null;
  }
  const consentAt = await recordDataProcessingConsent();
  trackEvent(ANALYTICS_EVENTS.DATA_PROCESSING_CONSENT_ACCEPTED, { consentAt });
  if (params.localPlots.length === 0) {
    return null;
  }
  const sync = await uploadUnsyncedPlotsForFarmer({
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });
  if (sync.uploaded > 0) {
    trackEvent(ANALYTICS_EVENTS.BACKUP_CONFIRMED, {
      uploaded: sync.uploaded,
      failed: sync.failed,
    });
  }
  return sync;
}
