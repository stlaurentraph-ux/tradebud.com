import type { FieldSyncDeltaResponse } from '@/features/api/fieldSyncDelta';

export type FieldSyncCursorSnapshot = {
  cursorMs: number;
  auditByFarmer: Record<string, string>;
  voucherFingerprint: string;
};

export function buildVoucherFingerprint(delta: FieldSyncDeltaResponse): string {
  const ids: string[] = [];
  for (const farmer of delta.farmers) ids.push(...farmer.voucherIds);
  return ids.sort().join('|');
}

export function buildAuditByFarmer(delta: FieldSyncDeltaResponse): Record<string, string> {
  const out: Record<string, string> = {};
  for (const farmer of delta.farmers) {
    if (farmer.latestAuditAt) out[farmer.farmerId] = farmer.latestAuditAt;
  }
  return out;
}

export function buildFieldSyncCursorSnapshot(delta: FieldSyncDeltaResponse): FieldSyncCursorSnapshot {
  const serverMs = Date.parse(delta.serverTime);
  return {
    cursorMs: Number.isFinite(serverMs) && serverMs > 0 ? serverMs : Date.now(),
    auditByFarmer: buildAuditByFarmer(delta),
    voucherFingerprint: buildVoucherFingerprint(delta),
  };
}

export function fieldSyncDeltaHasInboundChanges(
  delta: FieldSyncDeltaResponse,
  snapshot: FieldSyncCursorSnapshot | null,
): boolean {
  if (!snapshot) return true;
  for (const farmer of delta.farmers) {
    if (farmer.plots.length > 0) return true;
  }
  if (buildVoucherFingerprint(delta) !== snapshot.voucherFingerprint) return true;
  for (const farmer of delta.farmers) {
    const prevAudit = snapshot.auditByFarmer[farmer.farmerId];
    const nextAudit = farmer.latestAuditAt;
    if (nextAudit && nextAudit !== prevAudit) return true;
  }
  return false;
}

export type FieldSyncInboundChangeSet = {
  changedServerPlotIds: string[];
  vouchersChanged: boolean;
  auditChangedFarmerIds: string[];
};

export function buildFieldSyncInboundChangeSet(
  delta: FieldSyncDeltaResponse,
  snapshot: FieldSyncCursorSnapshot,
): FieldSyncInboundChangeSet {
  const changedServerPlotIds: string[] = [];
  for (const farmer of delta.farmers) {
    for (const plot of farmer.plots) {
      const id = plot.id?.trim();
      if (id) changedServerPlotIds.push(id);
    }
  }
  const vouchersChanged = buildVoucherFingerprint(delta) !== snapshot.voucherFingerprint;
  const auditChangedFarmerIds: string[] = [];
  for (const farmer of delta.farmers) {
    const prev = snapshot.auditByFarmer[farmer.farmerId];
    const next = farmer.latestAuditAt;
    if (next && next !== prev) auditChangedFarmerIds.push(farmer.farmerId);
  }
  return { changedServerPlotIds, vouchersChanged, auditChangedFarmerIds };
}
