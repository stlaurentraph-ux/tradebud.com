import { harvestDateIsoFromMs } from '@/features/harvest/harvestDeliveryDate';
import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { listLocalReceiptsMissingOnServer } from '@/features/harvest/findServerVoucherForLocalReceipt';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import {
  enqueuePendingSync,
  isLocalDeliveryReceiptPendingUpload,
  loadAllLocalDeliveryReceipts,
  updateLocalDeliveryReceipt,
} from '@/features/state/persistence';

export type ReconcileUnuploadedDeliveryReceiptsResult = {
  requeuedCount: number;
  unmatchedCount: number;
  fetchFailed: boolean;
};

/**
 * Re-queues on-device delivery receipts that never made it to Tracebud so Sync now can upload them.
 */
export async function reconcileUnuploadedLocalDeliveryReceipts(params: {
  farmerId: string;
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
  /** When set, skips the server fetch (e.g. restore/catalog already loaded vouchers). */
  vouchers?: readonly unknown[];
}): Promise<ReconcileUnuploadedDeliveryReceiptsResult> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) {
    return { requeuedCount: 0, unmatchedCount: 0, fetchFailed: false };
  }

  let vouchers: readonly unknown[] = params.vouchers ?? [];
  if (params.vouchers == null) {
    try {
      const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
        profileFarmerId: farmerId,
        localPlots: params.localPlots,
      });
      vouchers = await fetchMergedServerVouchers(voucherFarmerIds);
    } catch {
      return { requeuedCount: 0, unmatchedCount: 0, fetchFailed: true };
    }
  }

  const localRows = await loadAllLocalDeliveryReceipts();
  const unmatched = listLocalReceiptsMissingOnServer({
    receipts: localRows.map((row) => ({
      id: row.id,
      farmerId: row.farmerId,
      localPlotId: row.localPlotId,
      serverPlotId: row.serverPlotId,
      kg: row.kg,
      recordedAt: row.recordedAt,
      qrCodeRef: row.qrCodeRef,
      pendingSync: row.pendingSync,
      buyerLabel: row.buyerLabel,
      plotName: row.plotName,
    })),
    vouchers,
    localPlots: params.localPlots,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });

  let requeuedCount = 0;
  for (const receipt of unmatched) {
    if (!isLocalDeliveryReceiptPendingUpload(receipt)) continue;
    const kg = Number(receipt.kg);
    if (!Number.isFinite(kg) || kg <= 0) continue;
    if (!receipt.localPlotId?.trim()) continue;

    await enqueuePendingSync({
      createdAt: receipt.recordedAt || Date.now(),
      actionType: 'harvest',
      payloadJson: JSON.stringify({
        farmerId,
        plotId: receipt.localPlotId,
        kg,
        clientEventId: receipt.id,
        harvestDate: harvestDateIsoFromMs(receipt.recordedAt || Date.now()),
      }),
      lastError: null,
    });
    await updateLocalDeliveryReceipt(receipt.id, { pendingSync: true }).catch(() => undefined);
    requeuedCount += 1;
  }

  return {
    requeuedCount,
    unmatchedCount: unmatched.length,
    fetchFailed: false,
  };
}
