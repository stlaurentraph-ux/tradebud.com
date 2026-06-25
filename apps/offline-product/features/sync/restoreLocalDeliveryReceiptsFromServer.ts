import { formatVoucherBuyerLabel } from '@/features/harvest/deliveryReceiptModels';
import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { reconcileLocalDeliveryReceiptSyncStateFromServer } from '@/features/harvest/reconcileLocalDeliveryReceiptSyncState';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import {
  voucherDeliveredAtMs,
  voucherHasHarvestDate,
  voucherId,
  voucherKg,
  voucherPlotId,
  voucherPlotName,
  voucherQrRef,
} from '@/features/harvest/voucherRowFields';
import type { Plot } from '@/features/state/AppStateContext';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadAllLocalDeliveryReceipts,
  loadPlotServerLinks,
  persistLocalDeliveryReceipt,
  updateLocalDeliveryReceipt,
  isLocalDeliveryReceiptPendingUpload,
  type LocalDeliveryReceiptRow,
} from '@/features/state/persistence';

export type RestoreLocalDeliveryReceiptsResult = {
  restoredCount: number;
  reconciledCount: number;
  fetchFailed: boolean;
  skippedUnlinked: number;
  vouchers: unknown[];
};

function buyerLabelFromVoucher(voucher: unknown): string {
  return formatVoucherBuyerLabel(voucher, (key) => {
    if (key === 'harvest_receipt_qr_generated') return 'QR receipt';
    if (key === 'harvest_receipt_buyer_assigned') return 'Assigned buyer';
    return key;
  });
}

function resolveRecordedAtForVoucher(
  voucher: unknown,
  existing: readonly LocalDeliveryReceiptRow[],
): number {
  if (voucherHasHarvestDate(voucher)) {
    return voucherDeliveredAtMs(voucher);
  }

  const qr = voucherQrRef(voucher);
  if (qr) {
    const matched = existing.find((row) => row.qrCodeRef?.trim() === qr);
    if (matched?.recordedAt) return matched.recordedAt;
  }

  const id = voucherId(voucher);
  if (id) {
    const matched = existing.find((row) => row.id === id);
    if (matched?.recordedAt) return matched.recordedAt;
  }

  return voucherDeliveredAtMs(voucher);
}

/** Writes fetched server vouchers into local SQLite (skips rows already on device). */
export async function persistServerVouchersAsLocalReceipts(params: {
  vouchers: readonly unknown[];
  storageFarmerId: string;
  localPlots: Plot[];
  backendPlots?: readonly unknown[];
  plotServerLinks?: Record<string, string>;
}): Promise<{ restoredCount: number; skippedUnlinked: number }> {
  const storageFarmerId = params.storageFarmerId.trim();
  if (!storageFarmerId) {
    return { restoredCount: 0, skippedUnlinked: 0 };
  }

  const plotServerLinks =
    params.plotServerLinks ??
    ((await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>);
  const backendPlots = params.backendPlots ?? [];
  const existing = await loadAllLocalDeliveryReceipts();
  let restoredCount = 0;
  let skippedUnlinked = 0;

  for (const voucher of params.vouchers) {
    const id = voucherId(voucher);
    const serverPlotId = voucherPlotId(voucher);
    const kg = voucherKg(voucher);
    if (!id || !serverPlotId || kg <= 0) continue;

    const recordedAt = resolveRecordedAtForVoucher(voucher, existing);
    const storedById = id ? existing.find((row) => row.id === id) : null;
    const qr = voucherQrRef(voucher);
    const storedByQr = qr
      ? existing.find((row) => row.qrCodeRef?.trim() === qr)
      : null;
    const stored = storedById ?? storedByQr;
    if (stored) {
      const patch: Partial<
        Pick<LocalDeliveryReceiptRow, 'qrCodeRef' | 'pendingSync' | 'serverPlotId' | 'recordedAt'>
      > = {};
      if (stored.recordedAt !== recordedAt) {
        patch.recordedAt = recordedAt;
      }
      const serverQr = voucherQrRef(voucher);
      const serverPlot = voucherPlotId(voucher);
      if (isLocalDeliveryReceiptPendingUpload(stored) || !stored.qrCodeRef?.trim()) {
        patch.pendingSync = false;
        if (serverQr) patch.qrCodeRef = serverQr;
        if (serverPlot) patch.serverPlotId = serverPlot;
      }
      if (Object.keys(patch).length > 0) {
        await updateLocalDeliveryReceipt(stored.id, patch).catch(() => undefined);
        Object.assign(stored, patch);
      }
      continue;
    }

    const localPlotId = resolveLocalPlotIdForServerPlot({
      serverPlotId,
      localPlots: params.localPlots,
      plotServerLinks,
      backendPlots,
    });
    const resolvedLocalPlotId = localPlotId ?? serverPlotId;
    if (!localPlotId) {
      skippedUnlinked += 1;
    }

    const localPlot = params.localPlots.find((plot) => plot.id === resolvedLocalPlotId);
    const plotName =
      localPlot?.name?.trim() || voucherPlotName(voucher) || `Plot ${resolvedLocalPlotId.slice(0, 8)}`;

    await persistLocalDeliveryReceipt({
      id,
      farmerId: storageFarmerId,
      localPlotId: resolvedLocalPlotId,
      serverPlotId,
      plotName,
      kg,
      recordedAt,
      qrCodeRef: voucherQrRef(voucher),
      pendingSync: false,
      buyerLabel: buyerLabelFromVoucher(voucher),
    });
    restoredCount += 1;
    existing.push({
      id,
      farmerId: storageFarmerId,
      localPlotId: resolvedLocalPlotId,
      serverPlotId,
      plotName,
      kg,
      recordedAt,
      qrCodeRef: voucherQrRef(voucher),
      pendingSync: false,
      buyerLabel: buyerLabelFromVoucher(voucher),
    });
  }

  return { restoredCount, skippedUnlinked };
}

/**
 * Pulls synced delivery vouchers from Tracebud into local SQLite for cross-device restore.
 * Never overwrites pending on-device receipts waiting to upload.
 */
export async function restoreLocalDeliveryReceiptsFromServer(params: {
  apiFarmerId: string;
  profileFarmerId?: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
  /** When set, skips the server fetch (e.g. catalog already loaded vouchers). */
  vouchers?: readonly unknown[];
}): Promise<RestoreLocalDeliveryReceiptsResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  const storageFarmerId = params.profileFarmerId?.trim() || apiFarmerId;
  if (!apiFarmerId) {
    return { restoredCount: 0, reconciledCount: 0, fetchFailed: false, skippedUnlinked: 0, vouchers: [] };
  }

  let vouchers: readonly unknown[] = params.vouchers ?? [];
  if (params.vouchers == null) {
    try {
      const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
        profileFarmerId: storageFarmerId,
        localPlots: params.localPlots,
      });
      vouchers = await fetchMergedServerVouchers(voucherFarmerIds);
    } catch {
      return { restoredCount: 0, reconciledCount: 0, fetchFailed: true, skippedUnlinked: 0, vouchers: [] };
    }
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  const { restoredCount, skippedUnlinked } = await persistServerVouchersAsLocalReceipts({
    vouchers,
    storageFarmerId,
    localPlots: params.localPlots,
    backendPlots,
    plotServerLinks,
  });

  const { reconciledCount } = await reconcileLocalDeliveryReceiptSyncStateFromServer({
    vouchers,
    localPlots: params.localPlots,
    backendPlots,
    plotServerLinks,
  });

  return {
    restoredCount,
    reconciledCount,
    fetchFailed: false,
    skippedUnlinked,
    vouchers: [...vouchers],
  };
}
