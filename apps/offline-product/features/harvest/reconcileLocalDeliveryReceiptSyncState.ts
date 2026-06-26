import { findServerVoucherForLocalReceipt } from '@/features/harvest/findServerVoucherForLocalReceipt';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import {
  isLocalDeliveryReceiptPendingUpload,
  loadAllLocalDeliveryReceipts,
  updateLocalDeliveryReceipt,
} from '@/features/state/persistence';
import {
  voucherPlotId,
  voucherQrRef,
} from '@/features/harvest/voucherRowFields';

/** Clear stale pending flags when a local receipt already exists on the server. */
export async function reconcileLocalDeliveryReceiptSyncStateFromServer(params: {
  vouchers: readonly unknown[];
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): Promise<{ reconciledCount: number }> {
  const localRows = await loadAllLocalDeliveryReceipts();
  let reconciledCount = 0;

  for (const receipt of localRows) {
    if (!isLocalDeliveryReceiptPendingUpload(receipt)) continue;

    const voucher = findServerVoucherForLocalReceipt({
      receipt,
      vouchers: params.vouchers,
      localPlots: params.localPlots,
      backendPlots: params.backendPlots,
      plotServerLinks: params.plotServerLinks,
    });
    if (!voucher) continue;

    const qrCodeRef = voucherQrRef(voucher) || receipt.qrCodeRef;
    const serverPlotId = voucherPlotId(voucher) || receipt.serverPlotId;
    await updateLocalDeliveryReceipt(receipt.id, {
      pendingSync: false,
      ...(qrCodeRef ? { qrCodeRef } : {}),
      ...(serverPlotId ? { serverPlotId } : {}),
    }).catch(() => undefined);
    reconciledCount += 1;
  }

  return { reconciledCount };
}
