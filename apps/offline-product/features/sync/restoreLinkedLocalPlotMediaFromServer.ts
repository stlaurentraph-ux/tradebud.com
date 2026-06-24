import type { Plot } from '@/features/state/AppStateContext';
import {
  inboundPlotMediaKey,
  markInboundHydrated,
} from '@/features/sync/deviceSyncMarkers';
import { restoreLocalEvidenceFromServer } from '@/features/sync/restoreLocalEvidenceFromServer';
import { restoreLocalPlotPhotosFromServerAudit } from '@/features/sync/restoreLocalGroundTruthPhotosFromServer';
import { loadPlotServerLinks } from '@/features/state/persistence';

export type RestoreLinkedLocalPlotMediaResult = {
  evidenceRestored: number;
  groundTruthRestored: number;
  landTitleRestored: number;
  fetchFailed: boolean;
  downloadFailed: number;
};

/** Pull photos/docs from Tracebud for plots on this device only (not every server plot). */
export async function restoreLinkedLocalPlotMediaFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
  /** When false, skip audit_log photo scan (synced-evidence + tenure endpoints only). */
  includeAuditPhotos?: boolean;
}): Promise<RestoreLinkedLocalPlotMediaResult> {
  if (params.localPlots.length === 0) {
    return {
      evidenceRestored: 0,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
    };
  }

  const evidence = await restoreLocalEvidenceFromServer(params);
  if (!evidence.fetchFailed) {
    const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
      string,
      string
    >;
    for (const plot of params.localPlots) {
      if (!plotServerLinks[plot.id]?.trim()) continue;
      await markInboundHydrated(inboundPlotMediaKey(plot.id)).catch(() => undefined);
    }
  }
  if (params.includeAuditPhotos === false) {
    return {
      evidenceRestored: evidence.restoredCount,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: evidence.fetchFailed,
      downloadFailed: evidence.downloadFailed,
    };
  }

  const photos = await restoreLocalPlotPhotosFromServerAudit(params);
  return {
    evidenceRestored: evidence.restoredCount,
    groundTruthRestored: photos.groundTruthRestored,
    landTitleRestored: photos.landTitleRestored,
    fetchFailed: photos.fetchFailed || evidence.fetchFailed,
    downloadFailed: photos.downloadFailed + evidence.downloadFailed,
  };
}
