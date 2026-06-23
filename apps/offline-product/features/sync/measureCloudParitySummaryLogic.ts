import { shouldOfferPostAuthSync } from '@/features/sync/postAuthSyncOfferLogic';

export type CloudParityCounts = {
  localPlotCount: number;
  serverPlotCount: number | null;
  localReceiptCount: number;
  serverVoucherCount: number | null;
};

export type CloudParitySummary = CloudParityCounts & {
  needsRestore: boolean;
  plotGap: number;
  receiptGap: number;
};

export function summarizeCloudParityCounts(input: CloudParityCounts): CloudParitySummary {
  const plotGap = Math.max(0, (input.serverPlotCount ?? 0) - input.localPlotCount);
  const receiptGap = Math.max(0, (input.serverVoucherCount ?? 0) - input.localReceiptCount);
  const needsRestore = shouldOfferPostAuthSync({
    localPlotCount: input.localPlotCount,
    unsyncedPlotCount: 0,
    pendingQueueCount: 0,
    serverPlotCount: input.serverPlotCount,
    localReceiptCount: input.localReceiptCount,
    serverVoucherCount: input.serverVoucherCount,
  });
  return {
    ...input,
    needsRestore,
    plotGap,
    receiptGap,
  };
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function formatCloudParityHint(
  summary: CloudParitySummary,
  t: TranslateFn,
): string | null {
  if (!summary.needsRestore) return null;
  if (summary.plotGap > 0 && summary.receiptGap > 0) {
    return t('settings_cloud_parity_both', {
      plots: summary.plotGap,
      receipts: summary.receiptGap,
    });
  }
  if (summary.plotGap > 0) {
    return t('settings_cloud_parity_plots', { n: summary.plotGap });
  }
  if (summary.receiptGap > 0) {
    return t('settings_cloud_parity_receipts', { n: summary.receiptGap });
  }
  return null;
}
