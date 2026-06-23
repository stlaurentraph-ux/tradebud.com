import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import type { PendingSyncUploadActionType } from '@/features/sync/farmerArtifactRegistry';
import {
  deletePendingSyncAction,
  isLocalDeliveryReceiptPendingUpload,
  isPlotEvidencePendingUpload,
  isPlotGroundPhotoPendingUpload,
  isPlotTitlePhotoPendingUpload,
  loadAllLocalDeliveryReceipts,
  loadEvidenceForPlot,
  loadPendingSyncActions,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';
import { isDeclarationAuditSynced } from '@/features/sync/queueDeclarationAuditSync';
import { isFieldCloudAuditSynced } from '@/features/sync/queueFieldCloudAuditSync';

/** Compile-time guard: extend prune branches when PENDING_SYNC_UPLOAD_ACTION_TYPES grows. */
const PRUNE_BRANCH_COVERAGE: Record<PendingSyncUploadActionType, true> = {
  harvest: true,
  photos_sync: true,
  evidence_sync: true,
  audit_sync: true,
};
void PRUNE_BRANCH_COVERAGE;

/** Drop queue rows that no longer have local work to upload. */
export async function pruneRedundantPendingUploadActions(params: {
  farmerId: string;
}): Promise<number> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) return 0;

  const rows = await loadPendingSyncActions().catch(() => []);
  const receiptById = new Map(
    (await loadAllLocalDeliveryReceipts().catch(() => [])).map((row) => [row.id, row]),
  );
  let dropped = 0;

  for (const row of rows) {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(row.payloadJson) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (row.actionType === 'harvest') {
      const clientEventId = String(payload.clientEventId ?? '').trim();
      const receipt = clientEventId ? receiptById.get(clientEventId) : undefined;
      if (!receipt || !isLocalDeliveryReceiptPendingUpload(receipt)) {
        await deletePendingSyncAction(row.id).catch(() => undefined);
        dropped += 1;
      }
      continue;
    }

    if (row.actionType === 'audit_sync') {
      const eventType = String(payload.eventType ?? '').trim();
      const auditPayload =
        payload.payload && typeof payload.payload === 'object'
          ? (payload.payload as Record<string, unknown>)
          : {};
      if (!eventType) {
        await deletePendingSyncAction(row.id).catch(() => undefined);
        dropped += 1;
        continue;
      }
      const syncedDeclaration = await isDeclarationAuditSynced({
        eventType,
        payload: auditPayload,
      }).catch(() => false);
      const scopeId = String(auditPayload.farmerId ?? '').trim();
      const syncedCloud =
        scopeId.length > 0
          ? await isFieldCloudAuditSynced({ eventType, scopeId }).catch(() => false)
          : false;
      if (syncedDeclaration || syncedCloud) {
        await deletePendingSyncAction(row.id).catch(() => undefined);
        dropped += 1;
      }
      continue;
    }

    if (row.actionType !== 'photos_sync' && row.actionType !== 'evidence_sync') continue;

    const plotId = String(payload.plotId ?? '').trim();
    if (!plotId) continue;

    if (row.actionType === 'photos_sync') {
      const kind = payload.kind === 'land_title' ? 'land_title' : 'ground_truth';
      if (kind === 'land_title') {
        const titlePhotos = await loadTitlePhotosForPlot(plotId).catch(() => []);
        if (!titlePhotos.some(isPlotTitlePhotoPendingUpload)) {
          await deletePendingSyncAction(row.id).catch(() => undefined);
          dropped += 1;
        }
      } else {
        const groundPhotos = await loadPhotosForPlot(plotId).catch(() => []);
        if (!groundPhotos.some(isPlotGroundPhotoPendingUpload)) {
          await deletePendingSyncAction(row.id).catch(() => undefined);
          dropped += 1;
        }
      }
      continue;
    }

    if (row.actionType === 'evidence_sync') {
      const scopeId =
        payload.scope === 'producer' ? producerEvidenceScopeId(farmerId) : plotId;
      const evidence = await loadEvidenceForPlot(scopeId).catch(() => []);
      if (!evidence.some(isPlotEvidencePendingUpload)) {
        await deletePendingSyncAction(row.id).catch(() => undefined);
        dropped += 1;
      }
    }
  }

  return dropped;
}
