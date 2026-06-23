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
  return 'full';
}
