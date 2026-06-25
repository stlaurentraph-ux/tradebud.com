import { describe, expect, it } from 'vitest';

import {
  allLocalPlotsLinked,
  countQueueActionsForTypes,
  isPushOnlyIdleSync,
  localDeclarationsComplete,
  shouldSkipPushOnlyInboundHydration,
  shouldRefreshCloudParityAfterSync,
} from './pushOnlyIdleSyncPolicy';

describe('pushOnlyIdleSyncPolicy', () => {
  it('detects complete local declarations', () => {
    expect(
      localDeclarationsComplete(
        {
          id: 'f1',
          name: 'A',
          selfDeclared: true,
          selfDeclaredAt: 1,
          fpicConsent: true,
          laborNoChildLabor: true,
          laborNoForcedLabor: true,
        },
        [{ id: 'p1', name: 'P', areaHectares: 1, kind: 'permanent_crop', landTenureDeclared: true, noDeforestationDeclared: true }],
      ),
    ).toBe(true);
    expect(
      localDeclarationsComplete(
        { id: 'f1', name: 'A' },
        [{ id: 'p1', name: 'P', areaHectares: 1, kind: 'permanent_crop' }],
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
          { id: '1', actionType: 'harvest', payloadJson: '{}', createdAt: 1, lastError: null },
          { id: '2', actionType: 'audit_sync', payloadJson: '{}', createdAt: 2, lastError: null },
        ],
        ['harvest', 'photos_sync'],
      ),
    ).toBe(1);
  });

  it('detects when every local plot has a server link', () => {
    expect(allLocalPlotsLinked([{ id: 'p1', name: 'P', areaHectares: 1, kind: 'permanent_crop' }], { p1: 's1' })).toBe(
      true,
    );
    expect(allLocalPlotsLinked([{ id: 'p1', name: 'P', areaHectares: 1, kind: 'permanent_crop' }], {})).toBe(false);
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
