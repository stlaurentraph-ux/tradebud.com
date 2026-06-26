import { beforeEach, describe, expect, it, vi } from 'vitest';

const runFieldSyncPipeline = vi.fn();
const loadFarmerProfile = vi.fn();
const openFieldSyncSession = vi.fn();
const prepareFieldSyncContext = vi.fn();
const endSession = vi.fn();

vi.mock('@/features/sync/runFieldSyncPipeline', () => ({ runFieldSyncPipeline }));
vi.mock('@/features/state/persistence', () => ({ loadFarmerProfile }));
vi.mock('@/features/sync/runFieldSyncSession', () => ({ openFieldSyncSession }));
vi.mock('@/features/sync/resolveFieldSyncScope', () => ({ prepareFieldSyncContext }));
vi.mock('@/features/sync/syncQueueMutex', () => ({
  withSyncQueueLock: (fn: () => unknown) => fn(),
  setSyncQueuePhase: vi.fn(),
}));
vi.mock('@/features/sync/syncOperationLimits', () => ({
  SYNC_BACKGROUND_OPERATION_MS: 1000,
  SyncOperationTimeoutError: class extends Error {},
  withSyncOperationTimeout: (work: Promise<unknown>) => work,
}));
vi.mock('@/features/sync/syncOperationOutcome', () => ({ emitSyncOperationOutcome: vi.fn() }));
vi.mock('@/features/sync/autoBackupPolicy', () => ({
  evaluateConservativeAutoBackup: vi.fn(),
  recordAutoBackupAttempt: vi.fn(),
  recordAutoBackupOutcome: vi.fn(),
  summarizeAutoBackupError: vi.fn(),
}));

function pipelineResult() {
  return {
    outcome: {
      queueCompleted: 0,
      queueFailed: 0,
      queueFetchFailed: false,
      receiptsRestored: 0,
      evidenceRestored: 0,
      declarationsRestored: 0,
    },
    queueFirstError: undefined,
    lastPlotUploadResult: null,
    plotsRestored: 0,
    syncResultMessage: undefined,
  };
}

describe('runAutoBackup farmer attestations (H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openFieldSyncSession.mockResolvedValue({
      ok: true,
      session: { accessToken: 'tok' },
      end: endSession,
    });
    prepareFieldSyncContext.mockResolvedValue({ farmerId: 'farmer-1', ownedFarmerIds: ['farmer-1'] });
    runFieldSyncPipeline.mockResolvedValue(pipelineResult());
  });

  it('passes the persisted farmer with attestation flags to the sync pipeline', async () => {
    loadFarmerProfile.mockResolvedValue({
      id: 'farmer-1',
      role: 'farmer',
      name: 'Ada',
      selfDeclared: true,
      selfDeclaredAt: 123,
      fpicConsent: true,
      laborNoChildLabor: true,
      laborNoForcedLabor: true,
    });

    const { runAutoBackup } = await import('./runAutoBackup');
    await runAutoBackup({ farmerId: 'farmer-1', localPlots: [] });

    expect(runFieldSyncPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        syncFarmer: expect.objectContaining({
          id: 'farmer-1',
          selfDeclared: true,
          fpicConsent: true,
          laborNoChildLabor: true,
          laborNoForcedLabor: true,
        }),
      }),
    );
  });

  it('falls back to a stub farmer when the persisted id does not match', async () => {
    loadFarmerProfile.mockResolvedValue({
      id: 'other-farmer',
      role: 'farmer',
      selfDeclared: true,
      fpicConsent: true,
      laborNoChildLabor: true,
      laborNoForcedLabor: true,
    });

    const { runAutoBackup } = await import('./runAutoBackup');
    await runAutoBackup({ farmerId: 'farmer-1', localPlots: [], farmerDisplayName: 'Stub' });

    expect(runFieldSyncPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        syncFarmer: { id: 'farmer-1', role: 'farmer', selfDeclared: false, name: 'Stub' },
      }),
    );
  });
});
