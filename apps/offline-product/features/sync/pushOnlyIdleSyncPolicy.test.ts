import { describe, expect, it } from 'vitest';

import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  allLocalPlotsLinked,
  countQueueActionsForTypes,
  isPushOnlyIdleSync,
  localDeclarationsComplete,
  shouldSkipPushOnlyInboundHydration,
  shouldRefreshCloudParityAfterSync,
} from './pushOnlyIdleSyncPolicy';

function makeFarmer(overrides: Partial<FarmerProfile> = {}): FarmerProfile {
  return { id: 'f1', name: 'A', role: 'farmer', selfDeclared: false, ...overrides };
}

function makePlot(overrides: Partial<Plot> = {}): Plot {
  return {
    id: 'p1',
    farmerId: 'f1',
    name: 'P',
    createdAt: 1,
    areaSquareMeters: 10_000,
    areaHectares: 1,
    kind: 'polygon',
    points: [],
    ...overrides,
  };
}

function makeQueueAction(overrides: Partial<PendingSyncAction> = {}): PendingSyncAction {
  return {
    id: 1,
    actionType: 'harvest',
    payloadJson: '{}',
    createdAt: 1,
    hlcTimestamp: '1:1',
    attempts: 0,
    lastError: null,
    lastAttemptAt: null,
    ...overrides,
  };
}

describe('pushOnlyIdleSyncPolicy', () => {
  it('detects complete local declarations', () => {
    expect(
      localDeclarationsComplete(
        makeFarmer({
          selfDeclared: true,
          selfDeclaredAt: 1,
          fpicConsent: true,
          laborNoChildLabor: true,
          laborNoForcedLabor: true,
        }),
        [makePlot({ landTenureDeclared: true, noDeforestationDeclared: true })],
      ),
    ).toBe(true);
    expect(
      localDeclarationsComplete(makeFarmer(), [makePlot()]),
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
          makeQueueAction({ id: 1, actionType: 'harvest' }),
          makeQueueAction({ id: 2, actionType: 'audit_sync', createdAt: 2 }),
        ],
        ['harvest', 'photos_sync'],
      ),
    ).toBe(1);
  });

  it('detects when every local plot has a server link', () => {
    expect(allLocalPlotsLinked([makePlot()], { p1: 's1' })).toBe(true);
    expect(allLocalPlotsLinked([makePlot()], {})).toBe(false);
  });

  it('detects idle push_only when queue empty and markers satisfied', () => {
    expect(
      isPushOnlyIdleSync({
        queuePendingCount: 0,
        declarationsComplete: true,
        plotMediaHydrated: true,
        allPlotsLinked: true,
      }),
    ).toBe(true);
    expect(
      isPushOnlyIdleSync({
        queuePendingCount: 0,
        declarationsComplete: true,
        plotMediaHydrated: true,
        allPlotsLinked: false,
      }),
    ).toBe(false);
    expect(
      isPushOnlyIdleSync({
        queuePendingCount: 1,
        declarationsComplete: true,
        plotMediaHydrated: true,
        allPlotsLinked: true,
      }),
    ).toBe(false);
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
