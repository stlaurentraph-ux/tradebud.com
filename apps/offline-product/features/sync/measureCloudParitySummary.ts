import type { Plot } from '@/features/state/AppStateContext';
import { loadLocalDeliveryReceiptsForFarmer } from '@/features/harvest/localDeliveryReceipts';
import {
  countServerPlotsForPostAuthRestore,
  countServerVouchersForPostAuthRestore,
} from '@/features/sync/postAuthSyncOffer';
import {
  formatCloudParityHint,
  summarizeCloudParityCounts,
  type CloudParitySummary,
} from '@/features/sync/measureCloudParitySummaryLogic';

export type { CloudParityCounts, CloudParitySummary } from '@/features/sync/measureCloudParitySummaryLogic';
export { formatCloudParityHint, summarizeCloudParityCounts } from '@/features/sync/measureCloudParitySummaryLogic';

export async function measureCloudParitySummary(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<CloudParitySummary> {
  const profileFarmerId = params.profileFarmerId.trim();
  const localPlotCount = params.localPlots.length;
  if (!profileFarmerId) {
    return summarizeCloudParityCounts({
      localPlotCount,
      serverPlotCount: null,
      localReceiptCount: 0,
      serverVoucherCount: null,
    });
  }

  const localReceiptRows = await loadLocalDeliveryReceiptsForFarmer(profileFarmerId).catch(
    () => [],
  );
  const [serverPlotCount, serverVoucherCount] = await Promise.all([
    countServerPlotsForPostAuthRestore({
      profileFarmerId,
      localPlots: params.localPlots,
    }),
    countServerVouchersForPostAuthRestore({
      profileFarmerId,
      localPlots: params.localPlots,
    }),
  ]);

  return summarizeCloudParityCounts({
    localPlotCount,
    serverPlotCount,
    localReceiptCount: localReceiptRows.length,
    serverVoucherCount,
  });
}
