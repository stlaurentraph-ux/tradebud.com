import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveFieldSyncScope: vi.fn(),
  listLocalDeliveryReceiptFarmerIds: vi.fn(),
  loadAllLocalDeliveryReceipts: vi.fn(),
  loadLocalDeliveryReceiptsForFarmer: vi.fn(),
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  resolveFieldSyncScope: mocks.resolveFieldSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  listLocalDeliveryReceiptFarmerIds: mocks.listLocalDeliveryReceiptFarmerIds,
  loadAllLocalDeliveryReceipts: mocks.loadAllLocalDeliveryReceipts,
  loadLocalDeliveryReceiptsForFarmer: mocks.loadLocalDeliveryReceiptsForFarmer,
}));

import {
  loadFieldScopedDeliveryReceipts,
  resolveFieldHarvestFarmerIds,
} from './loadFieldScopedDeliveryReceipts';

describe('resolveFieldHarvestFarmerIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveFieldSyncScope.mockResolvedValue({
      apiFarmerId: 'server-farmer',
      ownedFarmerIds: ['linked-farmer'],
      serverPlotCount: 2,
    });
    mocks.listLocalDeliveryReceiptFarmerIds.mockResolvedValue(['legacy-farmer']);
  });

  it('includes profile, linked, plot, and local receipt farmer ids', async () => {
    const ids = await resolveFieldHarvestFarmerIds({
      profileFarmerId: 'profile-farmer',
      localPlots: [{ id: 'plot-1', farmerId: 'plot-farmer' } as any],
    });

    expect(ids.voucherFarmerIds.sort()).toEqual(
      ['legacy-farmer', 'linked-farmer', 'plot-farmer', 'profile-farmer', 'server-farmer'].sort(),
    );
  });
});

describe('loadFieldScopedDeliveryReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveFieldSyncScope.mockResolvedValue({
      apiFarmerId: 'server-farmer',
      ownedFarmerIds: ['linked-farmer'],
      serverPlotCount: 2,
    });
    mocks.listLocalDeliveryReceiptFarmerIds.mockResolvedValue([]);
    mocks.loadAllLocalDeliveryReceipts.mockResolvedValue([
      { id: 'r1', farmerId: 'server-farmer' },
      { id: 'r2', farmerId: 'profile-farmer' },
    ]);
  });

  it('loads all on-device receipts when signed in', async () => {
    const result = await loadFieldScopedDeliveryReceipts({
      profileFarmerId: 'profile-farmer',
      localPlots: [],
      isSignedIn: true,
    });

    expect(mocks.loadAllLocalDeliveryReceipts).toHaveBeenCalled();
    expect(result.rows).toHaveLength(2);
    expect(result.voucherFarmerIds).toContain('server-farmer');
    expect(result.voucherFarmerIds).toContain('profile-farmer');
  });

  it('uses profile id only when signed out', async () => {
    mocks.loadLocalDeliveryReceiptsForFarmer.mockResolvedValue([]);

    await loadFieldScopedDeliveryReceipts({
      profileFarmerId: 'profile-farmer',
      localPlots: [],
      isSignedIn: false,
    });

    expect(mocks.resolveFieldSyncScope).not.toHaveBeenCalled();
    expect(mocks.loadLocalDeliveryReceiptsForFarmer).toHaveBeenCalledWith('profile-farmer');
  });
});
