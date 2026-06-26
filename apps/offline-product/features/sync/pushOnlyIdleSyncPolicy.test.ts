import { describe, expect, it } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  allLocalPlotsLinked,
  countQueueActionsForTypes,
  localDeclarationsComplete,
  shouldSkipPushOnlyInboundHydration,
  shouldRefreshCloudParityAfterSync,
} from './pushOnlyIdleSyncPolicy';

const mkPlot = (over: Partial<Plot> & Pick<Plot, 'id'>): Plot => ({
  farmerId: 'f1',
  name: 'P',
  createdAt: 0,
  areaSquareMeters: 10000,
  areaHectares: 1,
  kind: 'polygon',
  points: [],
  ...over,
});

const mkAction = (over: Partial<PendingSyncAction> & Pick<PendingSyncAction, 'id' | 'actionType'>): PendingSyncAction => ({
  payloadJson: '{}',
  hlcTimestamp: `1:${over.id}`,
  createdAt: over.id,
  attempts: 0,
  lastError: null,
  lastAttemptAt: null,
  ...over,
});

describe('pushOnlyIdleSyncPolicy', () => {
  it('detects complete local declarations', () => {
    expect(
      localDeclarationsComplete(
        {
          id: 'f1',
          name: 'A',
          role: 'farmer',
          selfDeclared: true,
          selfDeclaredAt: 1,
          fpicConsent: true,
          laborNoChildLabor: true,
          laborNoForcedLabor: true,
        },
        [mkPlot({ id: 'p1', landTenureDeclared: true, noDeforestationDeclared: true })],
      ),
    ).toBe(true);
    expect(
      localDeclarationsComplete(
        { id: 'f1', name: 'A', role: 'farmer', selfDeclared: false },
        [mkPlot({ id: 'p1' })],
      ),
    ).toBe(false);
  });

  it('skips inbound hydration only when idle and markers satisfied', () => {
    expect(
      shouldSkipPushOnlyInboundHydration({
        queuePendingCount: 0,
        declarationsComplete: true,
        plotMediaHydrated: true,
      }),
    ).toBe(true);
    expect(
      shouldSkipPushOnlyInboundHydration({
        queuePendingCount: 1,
        declarationsComplete: true,
        plotMediaHydrated: true,
      }),
    ).toBe(false);
    expect(
      shouldSkipPushOnlyInboundHydration({
        queuePendingCount: 0,
        declarationsComplete: false,
        plotMediaHydrated: true,
      }),
    ).toBe(false);
  });

  it('counts queue rows for selected action types', () => {
    expect(
      countQueueActionsForTypes(
        [
          mkAction({ id: 1, actionType: 'harvest' }),
          mkAction({ id: 2, actionType: 'audit_sync' }),
        ],
        ['harvest', 'photos_sync'],
      ),
    ).toBe(1);
  });

  it('detects when every local plot has a server link', () => {
    expect(allLocalPlotsLinked([mkPlot({ id: 'p1' })], { p1: 's1' })).toBe(true);
    expect(allLocalPlotsLinked([mkPlot({ id: 'p1' })], {})).toBe(false);
  });

  it('skips parity refresh after idle push_only sync', () => {
    expect(
      shouldRefreshCloudParityAfterSync({
        syncMode: 'push_only',
        probeFailed: false,
        hasCursor: true,
        hasInboundChanges: false,
        pendingTotal: 0,
        cloudParityNeedsRestore: false,
      }),
    ).toBe(false);
    expect(
      shouldRefreshCloudParityAfterSync({
        syncMode: 'push_only',
        probeFailed: false,
        hasCursor: true,
        hasInboundChanges: false,
        pendingTotal: 0,
        cloudParityNeedsRestore: true,
      }),
    ).toBe(true);
  });
});
