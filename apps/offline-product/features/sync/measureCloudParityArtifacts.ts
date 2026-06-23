import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { fetchPlotSyncedEvidence } from '@/features/api/postPlot';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import {
  countServerDeclarationSignals,
  countServerPhotosFromAudit,
  serverHasActiveWalkDraft,
  serverHasProfilePhotoAudit,
} from '@/features/sync/cloudParityArtifactCounts';
import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  fetchBackendPlotsForSyncScope,
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';
import {
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadPlotMappingDraft,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';
import type { ExtendedCloudParityCounts } from '@/features/sync/measureCloudParitySummaryLogic';

export type { ExtendedCloudParityCounts } from '@/features/sync/measureCloudParitySummaryLogic';

export async function countLocalMediaArtifacts(plots: Plot[]): Promise<{
  groundTruth: number;
  landTitle: number;
  evidence: number;
}> {
  let groundTruth = 0;
  let landTitle = 0;
  let evidence = 0;
  for (const plot of plots) {
    groundTruth += (await loadPhotosForPlot(plot.id).catch(() => [])).length;
    landTitle += (await loadTitlePhotosForPlot(plot.id).catch(() => [])).length;
    evidence += (await loadEvidenceForPlot(plot.id).catch(() => [])).length;
  }
  return { groundTruth, landTitle, evidence };
}

export function countLocalPlotAttestationsComplete(plots: Plot[]): number {
  return plots.filter(
    (plot) => plot.landTenureDeclared === true && plot.noDeforestationDeclared === true,
  ).length;
}

export async function countServerEvidenceDocs(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<number | null> {
  try {
    const backendPlots = await fetchBackendPlotsForSyncScope({
      farmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    });
    const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
      string,
      string
    >;
    const serverPlotIds = new Set<string>();
    for (const row of backendPlots) {
      const serverPlotId = String((row as { id?: string }).id ?? '').trim();
      if (!serverPlotId) continue;
      const localPlotId = resolveLocalPlotIdForServerPlot({
        serverPlotId,
        localPlots: params.localPlots,
        plotServerLinks,
        backendPlots,
      });
      if (localPlotId || params.localPlots.length === 0) {
        serverPlotIds.add(serverPlotId);
      }
    }
    if (serverPlotIds.size === 0) return 0;

    const counts = await Promise.all(
      [...serverPlotIds].slice(0, 40).map(async (serverPlotId) => {
        const rows = await fetchPlotSyncedEvidence(serverPlotId).catch(() => []);
        return rows.length;
      }),
    );
    return counts.reduce((sum, n) => sum + n, 0);
  } catch {
    return null;
  }
}

export async function fetchCloudParityAuditRows(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<AuditLogRow[] | null> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) return null;
  try {
    const scope = await prepareFieldSyncContext({
      profileFarmerId,
      localPlots: params.localPlots,
    });
    const { fetchMergedAuditEventsForFarmer } = await import(
      '@/features/sync/fetchMergedAuditEventsForFarmer'
    );
    return await fetchMergedAuditEventsForFarmer(
      [scope.farmerId, ...scope.ownedFarmerIds],
      400,
    );
  } catch {
    return null;
  }
}

export function buildExtendedCountsFromAudit(params: {
  auditRows: AuditLogRow[] | null;
  localPlots: Plot[];
  localReceiptCount: number;
  serverPlotsMissingOnDevice: number | null;
  serverVoucherCount: number | null;
  localMedia: { groundTruth: number; landTitle: number; evidence: number };
  serverEvidenceDocs: number | null;
  localFarmer?: FarmerProfile;
  localHasWalkDraft: boolean;
}): ExtendedCloudParityCounts {
  const photoCounts =
    params.auditRows != null ? countServerPhotosFromAudit(params.auditRows) : null;
  const declarationSignals =
    params.auditRows != null ? countServerDeclarationSignals(params.auditRows) : null;

  return {
    localPlotCount: params.localPlots.length,
    serverPlotCount: params.serverPlotsMissingOnDevice,
    serverPlotsMissingOnDevice: params.serverPlotsMissingOnDevice,
    localReceiptCount: params.localReceiptCount,
    serverVoucherCount: params.serverVoucherCount,
    localGroundPhotos: params.localMedia.groundTruth,
    serverGroundPhotos: photoCounts?.groundTruth ?? null,
    localLandTitlePhotos: params.localMedia.landTitle,
    serverLandTitlePhotos: photoCounts?.landTitle ?? null,
    localEvidenceDocs: params.localMedia.evidence,
    serverEvidenceDocs: params.serverEvidenceDocs,
    localProducerComplete: params.localFarmer
      ? hasProducerAttestationsComplete(params.localFarmer)
      : false,
    serverHasProducerAudit: declarationSignals?.producerAudit ?? null,
    localPlotAttestationsComplete: countLocalPlotAttestationsComplete(params.localPlots),
    serverPlotAttestationAudits: declarationSignals?.plotAttestations ?? null,
    localHasProfilePhoto: Boolean(params.localFarmer?.profilePhotoUri?.trim()),
    serverHasProfilePhoto:
      params.auditRows != null ? serverHasProfilePhotoAudit(params.auditRows) : null,
    localHasWalkDraft: params.localHasWalkDraft,
    serverHasWalkDraft:
      params.auditRows != null ? serverHasActiveWalkDraft(params.auditRows) : null,
  };
}
