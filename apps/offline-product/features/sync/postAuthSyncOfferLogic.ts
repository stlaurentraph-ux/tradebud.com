export type PostAuthSyncOfferInput = {
  localPlotCount: number;
  unsyncedPlotCount: number;
  pendingQueueCount: number;
  serverPlotCount: number | null;
  localReceiptCount: number;
  serverVoucherCount: number | null;
};

/** Whether sign-in should trigger backup/sync (upload, queue drain, or cloud restore). */
export function shouldOfferPostAuthSync(input: PostAuthSyncOfferInput): boolean {
  if (input.pendingQueueCount > 0) return true;
  if (input.unsyncedPlotCount > 0) return true;
  if (input.localPlotCount === 0 && (input.serverPlotCount ?? 0) > 0) return true;
  if ((input.serverPlotCount ?? 0) > input.localPlotCount) return true;
  if ((input.serverVoucherCount ?? 0) > input.localReceiptCount) return true;
  return false;
}

export function postAuthSyncPlotCountHint(input: PostAuthSyncOfferInput): number {
  if (input.unsyncedPlotCount > 0) return input.unsyncedPlotCount;
  if (input.pendingQueueCount > 0) return input.pendingQueueCount;
  if ((input.serverPlotCount ?? 0) > input.localPlotCount) {
    return (input.serverPlotCount ?? 0) - input.localPlotCount;
  }
  if (input.localPlotCount === 0 && (input.serverPlotCount ?? 0) > 0) {
    return input.serverPlotCount ?? 0;
  }
  if ((input.serverVoucherCount ?? 0) > input.localReceiptCount) {
    return (input.serverVoucherCount ?? 0) - input.localReceiptCount;
  }
  if (input.localReceiptCount === 0 && (input.serverVoucherCount ?? 0) > 0) {
    return input.serverVoucherCount ?? 0;
  }
  return input.localPlotCount || input.localReceiptCount;
}
