import type { Plot } from '@/features/state/AppStateContext';
import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import {
  fetchBackendPlotsForSyncScope,
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';

export type { PostAuthSyncOfferInput } from './postAuthSyncOfferLogic';
export {
  postAuthSyncPlotCountHint,
  shouldOfferPostAuthSync,
} from './postAuthSyncOfferLogic';

/** Server plot count for restore detection (null when the list fetch fails). */
export async function countServerPlotsForPostAuthRestore(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<number | null> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) return null;
  try {
    const scope = await prepareFieldSyncContext({
      profileFarmerId,
      localPlots: params.localPlots,
    });
    const rows = await fetchBackendPlotsForSyncScope({
      farmerId: scope.farmerId,
      ownedFarmerIds: scope.ownedFarmerIds,
    });
    return rows.length;
  } catch {
    return null;
  }
}

/** Server voucher count for delivery receipt restore (null when fetch fails). */
export async function countServerVouchersForPostAuthRestore(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<number | null> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) return null;
  try {
    const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
      profileFarmerId,
      localPlots: params.localPlots,
    });
    const vouchers = await fetchMergedServerVouchers(voucherFarmerIds);
    return vouchers.length;
  } catch {
    return null;
  }
}
