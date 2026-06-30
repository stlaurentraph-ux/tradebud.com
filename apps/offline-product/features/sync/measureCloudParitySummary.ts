import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { loadLocalDeliveryReceiptsForFarmer, loadPlotServerLinks } from '@/features/state/persistence';
import {
  countServerPlotsForPostAuthRestore,
  countServerVouchersForPostAuthRestore,
} from '@/features/sync/postAuthSyncOffer';
import {
  buildExtendedCountsFromAudit,
  countLocalMediaArtifacts,
  countServerEvidenceDocs,
  fetchCloudParityAuditRows,
} from '@/features/sync/measureCloudParityArtifacts';
import { loadPlotMappingDraft } from '@/features/state/persistence';
import {
  countServerMediaMissingOnDevice,
} from '@/features/sync/countServerMediaMissingOnDevice';
import {
  fetchBackendPlotsForSyncScope,
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';
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

  if (!profileFarmerId) {
    return summarizeCloudParityCounts(
      buildExtendedCountsFromAudit({
        auditRows: null,
        localPlots: params.localPlots,
        localReceiptCount: 0,
        serverPlotCount: null,
        serverVoucherCount: null,
        localMedia: { groundTruth: 0, landTitle: 0, evidence: 0 },
        serverEvidenceDocs: null,
        localFarmer: params.localFarmer,
        localHasWalkDraft: false,
      }),
    );
  }

  // Resolve scope first so apiFarmerId / ownedFarmerIds are available for
  // producer-scoped local counts and the restore-mirroring media parity SSOT.
  let scope = { farmerId: profileFarmerId, ownedFarmerIds: [profileFarmerId] };
  try {
    scope = await prepareFieldSyncContext({
      profileFarmerId,
      localPlots: params.localPlots,
    });
  } catch {
    // keep default scope
  }

  const [localReceiptRows, serverPlotCount, serverVoucherCount, localMedia, auditRows, localDraft] =
    await Promise.all([
      loadLocalDeliveryReceiptsForFarmer(profileFarmerId).catch(() => []),
      countServerPlotsForPostAuthRestore({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      countServerVouchersForPostAuthRestore({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      countLocalMediaArtifacts(params.localPlots, { apiFarmerId: scope.farmerId }),
      fetchCloudParityAuditRows({
        profileFarmerId,
        localPlots: params.localPlots,
      }),
      loadPlotMappingDraft(profileFarmerId).catch(() => null),
    ]);

  const ownedFarmerIds = scope.ownedFarmerIds;

  const serverEvidenceDocs =
    auditRows != null
      ? await countServerEvidenceDocs({
          apiFarmerId: profileFarmerId,
          ownedFarmerIds,
          localPlots: params.localPlots,
        })
      : null;

  // Restore-mirroring media gap: when audit rows are available, count exactly
  // what Sync now would still pull, mirroring restoreLocalPlotPhotosFromServerAudit
  // + restoreLocalEvidenceFromServer (including producer evidence under
  // profile:{farmerId}). This is the SSOT — the brown banner cannot lie.
  let measuredMediaGap: number | undefined;
  if (auditRows != null) {
    try {
      const [backendPlots, plotServerLinks] = await Promise.all([
        fetchBackendPlotsForSyncScope({
          farmerId: scope.farmerId,
          ownedFarmerIds,
        }).catch(() => [] as readonly unknown[]),
        loadPlotServerLinks().catch(() => ({} as Record<string, string>)),
      ]);
      measuredMediaGap = await countServerMediaMissingOnDevice({
        apiFarmerId: scope.farmerId,
        localPlots: params.localPlots,
        auditRows,
        backendPlots,
        plotServerLinks: plotServerLinks as Record<string, string>,
      });
    } catch {
      measuredMediaGap = undefined;
    }
  }

  return summarizeCloudParityCounts(
    buildExtendedCountsFromAudit({
      auditRows,
      localPlots: params.localPlots,
      localReceiptCount: localReceiptRows.length,
      serverPlotCount,
      serverVoucherCount,
      localMedia,
      serverEvidenceDocs,
      localFarmer: params.localFarmer,
      localHasWalkDraft: localDraft != null,
      measuredMediaGap,
    }),
  );
}
