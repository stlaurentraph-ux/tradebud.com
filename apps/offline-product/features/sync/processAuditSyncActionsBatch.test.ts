import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  postAuditEventsBatchToBackend: vi.fn(),
  isDeclarationAuditSynced: vi.fn(),
  isFieldCloudAuditSynced: vi.fn(),
  markDeclarationAuditSynced: vi.fn(),
  markFieldCloudAuditSynced: vi.fn(),
  deletePendingSyncAction: vi.fn(),
  markPendingSyncAttempt: vi.fn(),
  logAuditEvent: vi.fn(async () => undefined),
}));

vi.mock('@/features/api/audit', () => ({
  postAuditEventsBatchToBackend: mocks.postAuditEventsBatchToBackend,
}));

vi.mock('@/features/sync/queueDeclarationAuditSync', () => ({
  isDeclarationAuditSynced: mocks.isDeclarationAuditSynced,
  markDeclarationAuditSynced: mocks.markDeclarationAuditSynced,
}));

vi.mock('@/features/sync/queueFieldCloudAuditSync', () => ({
  isFieldCloudAuditSynced: mocks.isFieldCloudAuditSynced,
  markFieldCloudAuditSynced: mocks.markFieldCloudAuditSynced,
}));

vi.mock('@/features/sync/reportSyncFailure', () => ({
  reportSyncFailure: vi.fn(),
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  invalidateAuditFetchCache: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  deletePendingSyncAction: mocks.deletePendingSyncAction,
  markPendingSyncAttempt: mocks.markPendingSyncAttempt,
  logAuditEvent: mocks.logAuditEvent,
}));

import { processAuditSyncActionsBatch } from '@/features/sync/processAuditSyncActionsBatch';

describe('processAuditSyncActionsBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDeclarationAuditSynced.mockResolvedValue(false);
    mocks.isFieldCloudAuditSynced.mockResolvedValue(false);
    mocks.postAuditEventsBatchToBackend.mockResolvedValue({
      ok: true,
      accepted: 1,
      idempotent: 0,
      failed: 0,
      results: [{ ok: true, id: 'evt-1' }],
    });
  });

  it('posts pending declaration audits in one batch call', async () => {
    const result = await processAuditSyncActionsBatch({
      actions: [
        {
          id: 7,
          actionType: 'audit_sync',
          payloadJson: JSON.stringify({
            eventType: 'plot_compliance_declared',
            payload: { farmerId: 'farmer-1', plotId: 'plot-1' },
          }),
          hlcTimestamp: '1:1',
          createdAt: 1,
        },
      ],
    });

    expect(result.completed).toBe(1);
    expect(mocks.postAuditEventsBatchToBackend).toHaveBeenCalledWith([
      expect.objectContaining({
        eventType: 'plot_compliance_declared',
        clientEventId: 'pending-sync-7',
      }),
    ]);
    expect(mocks.deletePendingSyncAction).toHaveBeenCalledWith(7);
  });

  it('does not drop the queue row when the 200 response omits the per-event result', async () => {
    // Regression: a truncated/empty results array (e.g. `{ ok: true, results: [] }`) must be
    // treated as a failure so the audit event retries instead of being silently lost.
    mocks.postAuditEventsBatchToBackend.mockResolvedValue({
      ok: true,
      accepted: 0,
      idempotent: 0,
      failed: 0,
      results: [],
    });

    const result = await processAuditSyncActionsBatch({
      actions: [
        {
          id: 9,
          actionType: 'audit_sync',
          payloadJson: JSON.stringify({
            eventType: 'plot_compliance_declared',
            payload: { farmerId: 'farmer-1', plotId: 'plot-1' },
          }),
          hlcTimestamp: '1:1',
          createdAt: 1,
        },
      ] as never,
    });

    expect(result.completed).toBe(0);
    expect(result.failedActions).toBe(1);
    expect(mocks.deletePendingSyncAction).not.toHaveBeenCalled();
    expect(mocks.markDeclarationAuditSynced).not.toHaveBeenCalled();
    expect(mocks.markPendingSyncAttempt).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ attempts: 1 }),
    );
  });
});
