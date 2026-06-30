import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetLocalFieldProducerState = vi.fn();
const setSetting = vi.fn();
const getSetting = vi.fn();
const deleteSetting = vi.fn();
const trackEvent = vi.fn();
const clearFieldProducerBootstrapCache = vi.fn();
const invalidateServerPlotFetchCache = vi.fn();
const invalidateServerPlotListCache = vi.fn();
const countServerPlotsForPostAuthRestore = vi.fn();
const countServerVouchersForPostAuthRestore = vi.fn();

vi.mock('@/features/state/persistence', () => ({
  resetLocalFieldProducerState,
  setSetting,
  getSetting,
  deleteSetting,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  clearFieldProducerBootstrapCache,
}));

vi.mock('@/features/sync/serverPlotFetchCache', () => ({
  invalidateServerPlotFetchCache,
}));

vi.mock('@/features/sync/serverPlotListCache', () => ({
  invalidateServerPlotListCache,
}));

vi.mock('@/features/sync/postAuthSyncOffer', () => ({
  countServerPlotsForPostAuthRestore,
  countServerVouchersForPostAuthRestore,
}));

vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: { ACCOUNT_SWITCH_LOCAL_RESET: 'account_switch_local_reset' },
  trackEvent,
}));

describe('resolveAccountSwitchLocalState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLocalFieldProducerState.mockResolvedValue(undefined);
    setSetting.mockResolvedValue(undefined);
    getSetting.mockResolvedValue(null);
  });

  it('keeps local data on first authenticated account for guest plots', async () => {
    const { resolveAccountSwitchLocalState } = await import('./accountSwitchLocalState');

    const resolution = await resolveAccountSwitchLocalState('Maria@Farm.co');

    expect(resolution).toEqual({
      clearedStaleLocalData: false,
      reason: 'guest_first_auth',
    });
    expect(resetLocalFieldProducerState).not.toHaveBeenCalled();
    expect(setSetting).toHaveBeenCalledWith('tracebud.lastAuthenticatedEmail', 'maria@farm.co');
  });

  it('keeps local data when the same account signs in again after sign-out', async () => {
    getSetting.mockResolvedValue('hector@farm.co');
    const { resolveAccountSwitchLocalState } = await import('./accountSwitchLocalState');

    const resolution = await resolveAccountSwitchLocalState('Hector@Farm.co');

    expect(resolution).toEqual({
      clearedStaleLocalData: false,
      reason: 'same_account',
    });
    expect(resetLocalFieldProducerState).not.toHaveBeenCalled();
  });

  it('clears stale local producer data when a different account signs in', async () => {
    getSetting.mockResolvedValue('hector@farm.co');
    const { resolveAccountSwitchLocalState } = await import('./accountSwitchLocalState');

    const resolution = await resolveAccountSwitchLocalState('maria@farm.co');

    expect(resolution).toEqual({
      clearedStaleLocalData: true,
      reason: 'switched_account',
    });
    expect(resetLocalFieldProducerState).toHaveBeenCalledTimes(1);
    expect(clearFieldProducerBootstrapCache).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('account_switch_local_reset', {
      previousEmail: 'hector@farm.co',
    });
    expect(setSetting).toHaveBeenCalledWith('tracebud.lastAuthenticatedEmail', 'maria@farm.co');
  });
});

describe('accountHasCloudFieldData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countServerPlotsForPostAuthRestore.mockResolvedValue(0);
    countServerVouchersForPostAuthRestore.mockResolvedValue(0);
  });

  it('returns true when server plots exist', async () => {
    countServerPlotsForPostAuthRestore.mockResolvedValue(2);
    const { accountHasCloudFieldData } = await import('./accountSwitchLocalState');

    await expect(accountHasCloudFieldData('farmer-1', [])).resolves.toBe(true);
  });

  it('returns true when server vouchers exist without plots', async () => {
    countServerVouchersForPostAuthRestore.mockResolvedValue(1);
    const { accountHasCloudFieldData } = await import('./accountSwitchLocalState');

    await expect(accountHasCloudFieldData('farmer-1', [])).resolves.toBe(true);
  });

  it('returns false for a brand-new account with no cloud field data', async () => {
    const { accountHasCloudFieldData } = await import('./accountSwitchLocalState');

    await expect(accountHasCloudFieldData('farmer-1', [])).resolves.toBe(false);
  });
});
