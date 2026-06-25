/** How much work Settings / background sync should run in one pass. */
export type FieldSyncMode = 'push_only' | 'full';

export type ResolveFieldSyncModeInput = {
  /** User or caller explicitly wants restore + push (sign-in backup, parity restore). */
  forceFull?: boolean;
  /** Cloud parity says server has artifacts this device should pull down. */
  needsCloudRestore?: boolean;
  /** Local plots not confirmed on Tracebud yet. */
  unsyncedPlotCount?: number;
  /** Geometry-blocked plots needing server attention. */
  blockedPlotCount?: number;
  /** SQLite queue rows still waiting to upload. */
  queuePendingCount?: number;
  /** Last plot-list fetch failed — need a full pass to reconcile. */
  plotsFetchFailed?: boolean;
  /** Device has a persisted field-sync cursor from a prior successful sync. */
  hasFieldSyncCursor?: boolean;
  /**
   * Delta probe result: false = server has nothing new to pull.
   * Omit when the probe failed — use deltaProbeFailed instead.
   */
  cloudDeltaHasInboundChanges?: boolean;
  /** Delta probe failed — stay on push_only when cursor exists and nothing local is pending. */
  deltaProbeFailed?: boolean;
};

/**
 * push_only: prune → link warm → enqueue new local work → drain queue (incremental).
 * full: pull from cloud → push (sign-in, parity restore, first sync, or empty queue refresh).
 */
export function resolveFieldSyncMode(input: ResolveFieldSyncModeInput): FieldSyncMode {
  if (input.forceFull) return 'full';
  if (input.plotsFetchFailed) return 'full';
  if (input.needsCloudRestore === true) return 'full';
  if ((input.unsyncedPlotCount ?? 0) > 0) return 'full';
  if ((input.blockedPlotCount ?? 0) > 0) return 'full';
  if ((input.queuePendingCount ?? 0) > 0) return 'push_only';
  if (input.cloudDeltaHasInboundChanges === true) return 'full';

  const nothingLocalPending =
    (input.unsyncedPlotCount ?? 0) === 0 &&
    (input.blockedPlotCount ?? 0) === 0 &&
    (input.queuePendingCount ?? 0) === 0;

  // `needsCloudRestore === true` already returned 'full' above, so it is guaranteed falsy here.
  if (
    nothingLocalPending &&
    input.hasFieldSyncCursor === true &&
    (input.cloudDeltaHasInboundChanges === false || input.deltaProbeFailed === true)
  ) {
    return 'push_only';
  }

  if (input.hasFieldSyncCursor === true && input.cloudDeltaHasInboundChanges === false) {
    return 'push_only';
  }
  return 'full';
}
