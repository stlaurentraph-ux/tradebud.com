import { patchHarvestDeliveryDate } from '@/features/api/postPlot';
import { findServerVoucherForLocalReceipt } from '@/features/harvest/findServerVoucherForLocalReceipt';
import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { harvestDateIsoFromMs } from '@/features/harvest/harvestDeliveryDate';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { voucherHasHarvestDate, voucherId } from '@/features/harvest/voucherRowFields';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import { persistServerVouchersAsLocalReceipts } from '@/features/sync/restoreLocalDeliveryReceiptsFromServer';
import { loadAllLocalDeliveryReceipts } from '@/features/state/persistence';

/** Push farmer-logged delivery dates from this device to Tracebud for cross-device restore. */
export async function backfillServerHarvestDatesFromLocal(params: {
  farmerId: string;
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
  vouchers?: readonly unknown[];
}): Promise<{ updatedCount: number; vouchers: unknown[] }> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) {
    return { updatedCount: 0, vouchers: params.vouchers ? [...params.vouchers] : [] };
  }

  let vouchers: unknown[] = params.vouchers ? [...params.vouchers] : [];
  if (vouchers.length === 0) {
    try {
      const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
        profileFarmerId: farmerId,
        localPlots: params.localPlots,
      });
      vouchers = await fetchMergedServerVouchers(voucherFarmerIds);
    } catch {
      return { updatedCount: 0, vouchers: [] };
    }
  }

  const localRows = await loadAllLocalDeliveryReceipts();
  let updatedCount = 0;

  for (const row of localRows) {
    const receipt = {
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
    };
    const matched = findServerVoucherForLocalReceipt({
      receipt,
      vouchers,
      localPlots: params.localPlots,
      backendPlots: params.backendPlots,
      plotServerLinks: params.plotServerLinks,
    });
    if (!matched || voucherHasHarvestDate(matched)) continue;

    const serverVoucherId = voucherId(matched);
    if (!serverVoucherId) continue;

    try {
      const result = await patchHarvestDeliveryDate({
        voucherId: serverVoucherId,
        harvestDate: harvestDateIsoFromMs(row.recordedAt),
        clientEventId: row.id.startsWith('harvest-') ? row.id : undefined,
      });
      if (result.updated) {
        updatedCount += 1;
        const index = vouchers.findIndex((voucher) => voucherId(voucher) === serverVoucherId);
        if (index >= 0) {
          vouchers[index] = {
            ...(vouchers[index] as object),
            harvest_date: harvestDateIsoFromMs(row.recordedAt),
            client_event_id: row.id.startsWith('harvest-') ? row.id : undefined,
          };
        }
      }
    } catch {
      // Keep syncing other receipts even when one patch fails.
    }
  }

  if (updatedCount > 0) {
    await persistServerVouchersAsLocalReceipts({
      vouchers,
      storageFarmerId: farmerId,
      localPlots: params.localPlots,
      backendPlots: params.backendPlots,
      plotServerLinks: params.plotServerLinks,
    }).catch(() => undefined);
  }

  return { updatedCount, vouchers };
}
