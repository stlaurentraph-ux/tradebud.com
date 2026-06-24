import { beforeEach, describe, expect, it, vi } from 'vitest';

const postAuditEventToBackend = vi.fn();
const hasSyncAuthSession = vi.fn();
const enqueuePendingSync = vi.fn();
const loadPendingSyncActions = vi.fn();
const markPendingSyncAttempt = vi.fn();
const getSetting = vi.fn();
const setSetting = vi.fn();
const deletePendingSyncAction = vi.fn();

vi.mock('@/features/api/audit', () => ({
  postAuditEventToBackend,
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  hasSyncAuthSession,
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  invalidateAuditFetchCache: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  enqueuePendingSync,
  loadPendingSyncActions,
  markPendingSyncAttempt,
  getSetting,
  setSetting,
  deletePendingSyncAction,
}));

async function loadModule() {
  return import('./queueFieldCloudAuditSync');
}

describe('queueFieldCloudAuditSync', () => {
  beforeEach(() => {
    vi.resetModules();
    postAuditEventToBackend.mockReset();
    hasSyncAuthSession.mockReset();
    enqueuePendingSync.mockReset();
    loadPendingSyncActions.mockReset();
    markPendingSyncAttempt.mockReset();
    getSetting.mockReset();
    setSetting.mockReset();
    deletePendingSyncAction.mockReset();

    hasSyncAuthSession.mockReturnValue(true);
    getSetting.mockResolvedValue(null);
    setSetting.mockResolvedValue(undefined);
    deletePendingSyncAction.mockResolvedValue(undefined);
    markPendingSyncAttempt.mockResolvedValue(undefined);
    loadPendingSyncActions.mockResolvedValue([]);
    enqueuePendingSync.mockImplementation(async (row) => {
      loadPendingSyncActions.mockResolvedValue([
        {
          id: 7,
          createdAt: row.createdAt,
          actionType: row.actionType,
          payloadJson: row.payloadJson,
          lastError: row.lastError,
          attempts: 0,
        },
      ]);
    });
  });

  it('queues only once during sync backfill (deferPost)', async () => {
    const { queueFieldCloudAuditSync } = await loadModule();

    await queueFieldCloudAuditSync({
      eventType: 'field_device_preferences_updated',
      scopeId: 'farmer-1',
      payload: { farmerId: 'farmer-1', updatedAt: 1 },
      deferPost: true,
    });

    expect(enqueuePendingSync).toHaveBeenCalledTimes(1);
    expect(postAuditEventToBackend).not.toHaveBeenCalled();
  });

  it('does not enqueue a second row when immediate POST fails', async () => {
    postAuditEventToBackend.mockResolvedValue({
      ok: false,
      reason: 'server_error',
      message: 'Invalid token',
    });
    const { queueFieldCloudAuditSync } = await loadModule();

    const result = await queueFieldCloudAuditSync({
      eventType: 'field_device_preferences_updated',
      scopeId: 'farmer-1',
      payload: { farmerId: 'farmer-1', updatedAt: 2 },
    });

    expect(result).toBe('queued');
    expect(enqueuePendingSync).toHaveBeenCalledTimes(1);
    expect(markPendingSyncAttempt).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ lastError: 'Invalid token' }),
    );
  });

  it('returns synced when skipIfSynced and marker exists', async () => {
    getSetting.mockResolvedValue('1730000000000');
    const { queueFieldCloudAuditSync } = await loadModule();

    const result = await queueFieldCloudAuditSync({
      eventType: 'field_device_preferences_updated',
      scopeId: 'farmer-1',
      payload: { farmerId: 'farmer-1' },
      skipIfSynced: true,
    });

    expect(result).toBe('synced');
    expect(enqueuePendingSync).not.toHaveBeenCalled();
    expect(postAuditEventToBackend).not.toHaveBeenCalled();
  });
});
