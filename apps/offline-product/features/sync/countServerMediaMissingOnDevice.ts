import type { Plot } from '@/features/state/AppStateContext';
import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { countPendingServerMediaRestore } from '@/features/sync/serverMediaRestorePlan';

/** @deprecated Use countPendingServerMediaRestore — kept for import stability. */
export async function countServerMediaMissingOnDevice(params: {
  apiFarmerId: string;
  localPlots: Plot[];
  auditRows: AuditLogRow[] | null;
  backendPlots: readonly unknown[];
  plotServerLinks: Record<string, string>;
  linkedServerPlotIds?: ReadonlySet<string>;
}): Promise<number> {
  return countPendingServerMediaRestore({
    apiFarmerId: params.apiFarmerId,
    localPlots: params.localPlots,
    auditRows: params.auditRows,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });
}

export { capacityCappedMissing } from '@/features/sync/mediaPhotoMatch';
export { countPendingServerMediaRestore } from '@/features/sync/serverMediaRestorePlan';
