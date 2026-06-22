import { findSyncedVoucherForLoggedDelivery } from '@/features/harvest/findSyncedVoucherForLoggedDelivery';
import type { LocalDeliveryReceipt } from '@/features/harvest/localDeliveryReceipts';
import {
  voucherId,
  voucherQrRef,
} from '@/features/harvest/voucherRowFields';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';

/** True when a server voucher row corresponds to this on-device delivery receipt. */
export function findServerVoucherForLocalReceipt(params: {
  receipt: Pick<
    LocalDeliveryReceipt,
    'id' | 'localPlotId' | 'kg' | 'recordedAt' | 'qrCodeRef'
  >;
  vouchers: readonly unknown[];
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): unknown | null {
  const receiptId = params.receipt.id.trim();
  const localQr = params.receipt.qrCodeRef?.trim() ?? '';

  for (const voucher of params.vouchers) {
    const id = voucherId(voucher);
    if (receiptId && id && receiptId === id) {
      return voucher;
    }
    const qr = voucherQrRef(voucher);
    if (localQr && qr && localQr === qr) {
      return voucher;
    }
  }

  const matchedQr = findSyncedVoucherForLoggedDelivery({
    delivery: {
      plotId: params.receipt.localPlotId,
      kg: params.receipt.kg,
      recordedAt: params.receipt.recordedAt,
    },
    vouchers: [...params.vouchers],
    localPlots: params.localPlots,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });
  if (!matchedQr) {
    return null;
  }

  return (
    params.vouchers.find((voucher) => voucherQrRef(voucher) === matchedQr) ?? null
  );
}

export function listLocalReceiptsMissingOnServer(params: {
  receipts: readonly LocalDeliveryReceipt[];
  vouchers: readonly unknown[];
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): LocalDeliveryReceipt[] {
  return params.receipts.filter(
    (receipt) =>
      !findServerVoucherForLocalReceipt({
        receipt,
        vouchers: params.vouchers,
        localPlots: params.localPlots,
        backendPlots: params.backendPlots,
        plotServerLinks: params.plotServerLinks,
      }),
  );
}
