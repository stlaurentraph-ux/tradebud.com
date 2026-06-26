import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { reconcileLocalDeliveryReceiptSyncStateFromServer } from '@/features/harvest/reconcileLocalDeliveryReceiptSyncState';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { hydrateDeclarationSyncMarkersFromServer } from '@/features/sync/hydrateDeclarationSyncMarkersFromServer';
import { hydrateFieldCloudAuditMarkersFromServer } from '@/features/sync/hydrateFieldCloudAuditMarkersFromServer';
import { hydrateMediaUploadMarkersFromServer } from '@/features/sync/hydrateMediaUploadMarkersFromServer';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  inboundDeclarationPlotKey,
  inboundDeclarationProducerKey,
  inboundFarmerKey,
  inboundPlotKey,
  inboundPlotMediaKey,
  inboundReceiptsKey,
  markInboundHydrated,
} from '@/features/sync/deviceSyncMarkers';
import { loadPlotServerLinks } from '@/features/state/persistence';

export type HydrateLocalSyncMarkersResult = {
  declarationProducerMarked: boolean;
  declarationPlotsMarked: number;
  fieldCloudMarked: number;
  mediaMarked: number;
  receiptsReconciled: number;
  inboundScopesMarked: number;
  fetchFailed: boolean;
};

/**
 * Before enqueue/prune: align local sync markers with cloud state so already-uploaded
 * artifacts are not re-queued on a new device or after a partial sync.
 */
export async function hydrateLocalSyncMarkersFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer: FarmerProfile | undefined;
  localPlots: Plot[];
}): Promise<HydrateLocalSyncMarkersResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  const result: HydrateLocalSyncMarkersResult = {
    declarationProducerMarked: false,
    declarationPlotsMarked: 0,
    fieldCloudMarked: 0,
    mediaMarked: 0,
    receiptsReconciled: 0,
    inboundScopesMarked: 0,
    fetchFailed: false,
  };

  if (!apiFarmerId) return result;

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer([apiFarmerId, ...params.ownedFarmerIds]);
  } catch {
    result.fetchFailed = true;
    return result;
  }

  const declarations = await hydrateDeclarationSyncMarkersFromServer({
    ...params,
    auditRows,
  }).catch(() => ({
    producerMarked: false,
    plotsMarked: 0,
    fetchFailed: true,
  }));
  result.declarationProducerMarked = declarations.producerMarked;
  result.declarationPlotsMarked = declarations.plotsMarked;
  if (declarations.fetchFailed) result.fetchFailed = true;

  const fieldCloud = await hydrateFieldCloudAuditMarkersFromServer({
    apiFarmerId,
    auditRows,
  }).catch(() => ({ marked: 0 }));
  result.fieldCloudMarked = fieldCloud.marked;

  const media = await hydrateMediaUploadMarkersFromServer({
    apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
    localPlots: params.localPlots,
    auditRows,
  }).catch(() => ({ marked: 0, fetchFailed: true, plotMediaHydratedPlotIds: [] as string[] }));
  result.mediaMarked = media.marked;
  if (media.fetchFailed) result.fetchFailed = true;

  const farmerId = params.localFarmer?.id?.trim();
  let inboundScopesMarked = 0;
  const markInbound = async (scope: Parameters<typeof markInboundHydrated>[0]) => {
    await markInboundHydrated(scope).catch(() => undefined);
    inboundScopesMarked += 1;
  };

  if (declarations.producerMarked && farmerId) {
    await markInbound(inboundDeclarationProducerKey(farmerId));
  }
  if (farmerId) {
    const { isDeclarationAuditSynced } = await import('@/features/sync/queueDeclarationAuditSync');
    for (const plot of params.localPlots) {
      if (!(plot.landTenureDeclared && plot.noDeforestationDeclared)) continue;
      const synced = await isDeclarationAuditSynced({
        eventType: 'plot_compliance_declared',
        payload: {
          plotId: plot.id,
          farmerId,
          landTenureDeclared: true,
          noDeforestationDeclared: true,
          source: 'hydrate',
        },
      }).catch(() => false);
      if (synced) {
        await markInbound(inboundDeclarationPlotKey(plot.id));
      }
    }
  }
  if (fieldCloud.marked > 0 && farmerId) {
    await markInbound(inboundFarmerKey(farmerId));
  }
  for (const plotId of media.plotMediaHydratedPlotIds) {
    await markInbound(inboundPlotMediaKey(plotId));
  }

  if (params.localFarmer?.id && params.localPlots.length >= 0) {
    const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
      profileFarmerId: params.localFarmer.id,
      localPlots: params.localPlots,
    });
    const [vouchers, backendPlots, plotServerLinks] = await Promise.all([
      fetchMergedServerVouchers(voucherFarmerIds).catch(() => [] as unknown[]),
      fetchBackendPlotsForSyncScope({
        farmerId: apiFarmerId,
        ownedFarmerIds: params.ownedFarmerIds,
      }).catch(() => []),
      loadPlotServerLinks().catch((): Record<string, string> => ({})),
    ]);
    const receipts = await reconcileLocalDeliveryReceiptSyncStateFromServer({
      vouchers,
      localPlots: params.localPlots,
      backendPlots,
      plotServerLinks,
    }).catch(() => ({ reconciledCount: 0 }));
    result.receiptsReconciled = receipts.reconciledCount;
    if (receipts.reconciledCount > 0 && farmerId) {
      await markInbound(inboundReceiptsKey(farmerId));
    }

    for (const plot of params.localPlots) {
      const serverPlotId = plotServerLinks[plot.id]?.trim();
      if (serverPlotId) {
        await markInbound(inboundPlotKey(plot.id));
      }
    }
  }

  result.inboundScopesMarked = inboundScopesMarked;
  return result;
}
