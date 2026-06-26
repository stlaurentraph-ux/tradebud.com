import type { FieldSyncInboundChangeSet } from '@/features/sync/fieldSyncDeltaEvaluate';

export type FieldSyncRestoreScope = {
  serverPlotIds: ReadonlySet<string>;
  restoreVouchers: boolean;
  restoreFarmerAuditArtifacts: boolean;
};

export function buildFieldSyncRestoreScope(
  changeSet: FieldSyncInboundChangeSet,
): FieldSyncRestoreScope {
  return {
    serverPlotIds: new Set(changeSet.changedServerPlotIds),
    restoreVouchers: changeSet.vouchersChanged,
    restoreFarmerAuditArtifacts: changeSet.auditChangedFarmerIds.length > 0,
  };
}

export function isPlotInRestoreScope(
  serverPlotId: string,
  scope: FieldSyncRestoreScope | undefined,
): boolean {
  if (!scope) return true;
  const id = serverPlotId.trim();
  return id.length > 0 && scope.serverPlotIds.has(id);
}
