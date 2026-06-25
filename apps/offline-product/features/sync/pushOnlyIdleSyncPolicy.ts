import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import type { PendingSyncAction } from '@/features/state/persistence';

/** Local declaration flags are complete — nothing to pull from audit_log. */
export function localDeclarationsComplete(
  localFarmer: FarmerProfile | undefined,
  localPlots: Plot[],
): boolean {
  if (!hasProducerAttestationsComplete(localFarmer)) return false;
  if (localPlots.length === 0) return true;
  return localPlots.every((plot) => plot.landTenureDeclared && plot.noDeforestationDeclared);
}

export function allLocalPlotsLinked(
  localPlots: Plot[],
  plotServerLinks: Record<string, string>,
): boolean {
  if (localPlots.length === 0) return true;
  return localPlots.every((plot) => Boolean(plotServerLinks[plot.id]?.trim()));
}

export function countQueueActionsForTypes(
  rows: readonly PendingSyncAction[],
  actionTypes: readonly PendingSyncAction['actionType'][],
): number {
  const allowed = new Set(actionTypes);
  return rows.filter((row) => allowed.has(row.actionType)).length;
}

/**
 * push_only with nothing outbound pending and inbound markers satisfied —
 * skip audit/voucher/plot-list hydration and per-plot evidence probes.
 */
export function shouldSkipPushOnlyInboundHydration(input: {
  queuePendingCount: number;
  declarationsComplete: boolean;
  plotMediaHydrated: boolean;
}): boolean {
  if (input.queuePendingCount > 0) return false;
  if (!input.declarationsComplete) return false;
  return input.plotMediaHydrated;
}

/** Heavy parity audit fetch is unnecessary after an idle push_only sync. */
export function shouldRefreshCloudParityAfterSync(input: {
  syncMode: 'push_only' | 'full';
  probeFailed: boolean;
  hasCursor: boolean;
  hasInboundChanges: boolean;
  pendingTotal: number;
  cloudParityNeedsRestore: boolean;
}): boolean {
  if (input.cloudParityNeedsRestore) return true;
  if (input.syncMode !== 'push_only') return true;
  if (input.pendingTotal > 0) return true;
  if (input.probeFailed) return true;
  if (!input.hasCursor) return true;
  if (input.hasInboundChanges) return true;
  return false;
}
