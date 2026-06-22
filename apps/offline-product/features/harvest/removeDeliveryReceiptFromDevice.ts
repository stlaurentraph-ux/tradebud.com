import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';
import { dismissDeliveryReceiptIds } from '@/features/harvest/dismissedDeliveryReceipts';
import { clearCachedReceipt } from '@/features/harvest/receiptNavigationCache';
import { logAuditEvent } from '@/features/state/persistence';
import {
  deleteLocalDeliveryReceipt,
  deletePendingHarvestSyncForReceipt,
  findLocalDeliveryReceiptIdsForRemoval,
} from '@/features/state/persistence';

export type RemoveDeliveryReceiptResult = {
  removedLocalCount: number;
  removedPendingCount: number;
  dismissedIds: string[];
};

/** Remove a delivery receipt from this device (local row, queue, and hidden server voucher id). */
export async function removeDeliveryReceiptFromDevice(params: {
  farmerId: string;
  receipt: DeliveryReceiptRecord;
}): Promise<RemoveDeliveryReceiptResult> {
  const receiptId = params.receipt.id.trim();
  const localIds = await findLocalDeliveryReceiptIdsForRemoval({
    farmerId: params.farmerId,
    receipt: params.receipt,
  });

  let removedLocalCount = 0;
  for (const localId of localIds) {
    if (await deleteLocalDeliveryReceipt(localId)) {
      removedLocalCount += 1;
    }
  }

  const removedPendingCount = await deletePendingHarvestSyncForReceipt({
    receiptId,
    receipt: params.receipt,
  });

  const dismissedIds = [...new Set([receiptId, ...localIds])];
  await dismissDeliveryReceiptIds(dismissedIds);
  for (const id of dismissedIds) {
    clearCachedReceipt(id);
  }

  await logAuditEvent({
    userId: params.farmerId,
    eventType: 'delivery_receipt_removed_from_device',
    payload: {
      receiptId,
      plotId: params.receipt.plotId,
      kg: params.receipt.kg,
      removedLocalCount,
      removedPendingCount,
      dismissedIds,
    },
  }).catch(() => undefined);

  return { removedLocalCount, removedPendingCount, dismissedIds };
}
