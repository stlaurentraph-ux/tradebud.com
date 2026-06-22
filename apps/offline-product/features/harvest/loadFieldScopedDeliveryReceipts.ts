import { resolveFieldSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  listLocalDeliveryReceiptFarmerIds,
  loadAllLocalDeliveryReceipts,
  type LocalDeliveryReceiptRow,
} from '@/features/state/persistence';
import type { Plot } from '@/features/state/AppStateContext';

function uniqueIds(candidates: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of candidates) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

/** Every farmer id that may own harvest vouchers for this signed-in field profile. */
export async function resolveFieldHarvestFarmerIds(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<{ apiFarmerId: string; ownedFarmerIds: string[]; voucherFarmerIds: string[] }> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) {
    return { apiFarmerId: '', ownedFarmerIds: [], voucherFarmerIds: [] };
  }

  const scope = await resolveFieldSyncScope({
    profileFarmerId,
    localPlots: params.localPlots,
  });

  const voucherFarmerIds = uniqueIds([
    profileFarmerId,
    scope.apiFarmerId,
    ...scope.ownedFarmerIds,
    ...params.localPlots.map((plot) => plot.farmerId ?? ''),
    ...(await listLocalDeliveryReceiptFarmerIds().catch(() => [])),
  ]);

  return {
    apiFarmerId: scope.apiFarmerId,
    ownedFarmerIds: scope.ownedFarmerIds,
    voucherFarmerIds,
  };
}

export type FieldDeliveryReceiptScope = {
  rows: LocalDeliveryReceiptRow[];
  apiFarmerId: string;
  ownedFarmerIds: string[];
  voucherFarmerIds: string[];
};

/** Loads on-device receipts and resolves the full server voucher farmer scope. */
export async function loadFieldScopedDeliveryReceipts(params: {
  profileFarmerId: string;
  localPlots: Plot[];
  isSignedIn?: boolean;
}): Promise<FieldDeliveryReceiptScope> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) {
    return { rows: [], apiFarmerId: '', ownedFarmerIds: [], voucherFarmerIds: [] };
  }

  if (params.isSignedIn === false) {
    const { loadLocalDeliveryReceiptsForFarmer } = await import('@/features/state/persistence');
    const rows = await loadLocalDeliveryReceiptsForFarmer(profileFarmerId);
    return {
      rows,
      apiFarmerId: profileFarmerId,
      ownedFarmerIds: [],
      voucherFarmerIds: [profileFarmerId],
    };
  }

  const harvestScope = await resolveFieldHarvestFarmerIds({
    profileFarmerId,
    localPlots: params.localPlots,
  });
  const rows = await loadAllLocalDeliveryReceipts();

  return {
    rows,
    apiFarmerId: harvestScope.apiFarmerId,
    ownedFarmerIds: harvestScope.ownedFarmerIds,
    voucherFarmerIds: harvestScope.voucherFarmerIds,
  };
}
