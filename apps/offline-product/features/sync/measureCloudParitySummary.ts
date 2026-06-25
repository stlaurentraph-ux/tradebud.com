import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { loadLocalDeliveryReceiptsForFarmer, loadPlotMappingDraft, loadPlotServerLinks } from '@/features/state/persistence';
import {
  buildExtendedCountsFromAudit,
  countLocalMediaArtifacts,
  countServerEvidenceDocs,
  fetchCloudParityAuditRows,
} from '@/features/sync/measureCloudParityArtifacts';
import {
  countServerPlotsMissingOnDeviceForRestore,
  countServerVouchersForPostAuthRestore,
} from '@/features/sync/postAuthSyncOffer';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  formatCloudParityHint,
  formatCloudParityHints,
  summarizeCloudParityCounts,
  type CloudParitySummary,
} from '@/features/sync/measureCloudParitySummaryLogic';

export type { CloudParitySummary } from '@/features/sync/measureCloudParitySummaryLogic';
export {
  formatCloudParityHint,
  formatCloudParityHints,
  summarizeCloudParityCounts,
} from '@/features/sync/measureCloudParitySummaryLogic';

export async function measureCloudParitySummary(params: {
  profileFarmerId: string;
  localPlots: Plot[];
  localFarmer?: FarmerProfile;
}): Promise<CloudParitySummary> {
  const profileFarmerId = params.profileFarmerId.trim();
  const localPlotCount = params.localPlots.length;

  if (!profileFarmerId) {
    return summarizeCloudParityCounts(
      buildExtendedCountsFromAudit({
        auditRows: null,
        localPlots: params.localPlots,
        localReceiptCount: 0,
        serverPlotCount: null,
        serverPlotsMissingOnDevice: null,
        serverVoucherCount: null,
        localMedia: { groundTruth: 0, landTitle: 0, evidence: 0 },
        serverEvidenceDocs: null,
        localFarmer: params.localFarmer,
        localHasWalkDraft: false,
      }),
    );
  }

  const [localReceiptRows, serverPlotsMissingOnDevice, serverVoucherCount, localMedia, auditRows, localDraft, plotServerLinks] =
    await Promise.all([
      loadLocalDeliveryReceiptsForFarmer(profileFarmerId).catch(() => []),
      countServerPlotsMissingOnDeviceForRestore({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      countServerVouchersForPostAuthRestore({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      countLocalMediaArtifacts(params.localPlots),
      fetchCloudParityAuditRows({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      loadPlotMappingDraft(profileFarmerId).catch(() => null),
      loadPlotServerLinks().catch(() => ({})),
    ]);

  let ownedFarmerIds: string[] = [profileFarmerId];
  if (auditRows != null) {
    try {
      const { prepareFieldSyncContext } = await import('@/features/sync/resolveFieldSyncScope');
      const scope = await prepareFieldSyncContext({
        profileFarmerId,
        localPlots: params.localPlots,
      });
      ownedFarmerIds = scope.ownedFarmerIds;
    } catch {
      // keep default
    }
  }

  const serverEvidenceDocs =
    auditRows != null
      ? await countServerEvidenceDocs({
          apiFarmerId: profileFarmerId,
          ownedFarmerIds,
          localPlots: params.localPlots,
        })
      : null;

  const backendPlots =
    auditRows != null
      ? await fetchBackendPlotsForSyncScope({
          farmerId: profileFarmerId,
          ownedFarmerIds,
        }).catch(() => [])
      : [];

  return summarizeCloudParityCounts(
    buildExtendedCountsFromAudit({
      auditRows,
      localPlots: params.localPlots,
      localReceiptCount: localReceiptRows.length,
      serverPlotsMissingOnDevice,
      serverVoucherCount,
      localMedia,
      serverEvidenceDocs,
      localFarmer: params.localFarmer,
      localHasWalkDraft: localDraft != null,
      plotServerLinks: plotServerLinks as Record<string, string>,
      backendPlots,
    }),
  );
}
