import { resolveDocumentUploadReason } from '@/features/evidence/documentUploadReason';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import { pendingSyncDedupKey } from '@/features/sync/pendingSyncDedup';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import {
  enqueuePendingDeclarationAuditsForDevice,
} from '@/features/sync/queueDeclarationAuditSync';
import {
  enqueuePendingSync,
  loadEvidenceForPlot,
  loadLocalDeliveryReceiptsForFarmer,
  loadPendingSyncActions,
  loadPhotosForPlot,
  loadPlotCadastralKey,
  loadPlotTenure,
  loadTitlePhotosForPlot,
  isPlotTitlePhotoPendingUpload,
} from '@/features/state/persistence';

export type EnqueuePlotDependentSyncResult = {
  groundTruth: boolean;
  landTitle: boolean;
  evidence: boolean;
  harvests: number;
};

function harvestAlreadyQueued(
  rows: Awaited<ReturnType<typeof loadPendingSyncActions>>,
  clientEventId: string,
): boolean {
  const key = `harvest:${clientEventId.trim()}`;
  return rows.some(
    (row) =>
      row.actionType === 'harvest' && pendingSyncDedupKey(row.actionType, row.payloadJson) === key,
  );
}

/** Queue harvests, photos, and evidence that depend on this plot being on the server. */
export async function enqueuePlotDependentSyncActions(params: {
  localPlotId: string;
  farmerId: string;
}): Promise<EnqueuePlotDependentSyncResult> {
  const result: EnqueuePlotDependentSyncResult = {
    groundTruth: false,
    landTitle: false,
    evidence: false,
    harvests: 0,
  };

  const localPlotId = params.localPlotId.trim();
  const farmerId = params.farmerId.trim();
  if (!localPlotId || !farmerId) return result;

  const reason = resolveDocumentUploadReason(null);
  const now = Date.now();

  const groundPhotos = await loadPhotosForPlot(localPlotId).catch(() => []);
  if (groundPhotos.length > 0) {
    await enqueuePendingSync({
      createdAt: now,
      actionType: 'photos_sync',
      payloadJson: JSON.stringify({
        plotId: localPlotId,
        kind: 'ground_truth',
        note: 'Ground truth photos enqueued after plot upload',
      }),
      lastError: null,
    });
    result.groundTruth = true;
  }

  const [titlePhotos, cadastralKey, tenure] = await Promise.all([
    loadTitlePhotosForPlot(localPlotId).catch(() => []),
    loadPlotCadastralKey(localPlotId).catch(() => null),
    loadPlotTenure(localPlotId).catch(() => ({
      informalTenure: false,
      informalTenureNote: null,
    })),
  ]);
  if (titlePhotos.length > 0 && titlePhotos.some(isPlotTitlePhotoPendingUpload)) {
    await enqueuePendingSync({
      createdAt: now,
      actionType: 'photos_sync',
      payloadJson: JSON.stringify({
        legal: {
          cadastralKey,
          informalTenure: tenure.informalTenure ? true : null,
          informalTenureNote: tenure.informalTenureNote,
          reason,
        },
        plotId: localPlotId,
        kind: 'land_title',
        photos: titlePhotos.map((photo) => ({
          cadastralKey,
          informalTenure: tenure.informalTenure ? true : null,
          informalTenureNote: tenure.informalTenureNote,
          uri: photo.uri,
          takenAt: photo.takenAt,
        })),
        note: 'Land title photos enqueued after plot upload',
      }),
      lastError: null,
    });
    result.landTitle = true;
  }

  const evidence = await loadEvidenceForPlot(localPlotId).catch(() => []);
  if (evidence.length > 0) {
    await enqueuePendingSync({
      createdAt: now,
      actionType: 'evidence_sync',
      payloadJson: JSON.stringify({
        plotId: localPlotId,
        farmerId,
        reason,
      }),
      lastError: null,
    });
    result.evidence = true;
  }

  const [localReceipts, pendingActions] = await Promise.all([
    loadLocalDeliveryReceiptsForFarmer(farmerId).catch(() => []),
    loadPendingSyncActions().catch(() => []),
  ]);
  for (const receipt of localReceipts) {
    if (receipt.localPlotId !== localPlotId || !receipt.pendingSync || receipt.qrCodeRef?.trim()) {
      continue;
    }
    if (harvestAlreadyQueued(pendingActions, receipt.id)) continue;
    await enqueuePendingSync({
      createdAt: receipt.recordedAt || now,
      actionType: 'harvest',
      payloadJson: JSON.stringify({
        farmerId,
        plotId: localPlotId,
        kg: receipt.kg,
        clientEventId: receipt.id,
      }),
      lastError: null,
    });
    result.harvests += 1;
  }

  return result;
}

/** Ensure every server-linked plot has pending sync rows for local attachments. */
export async function enqueuePlotDependentSyncForLinkedPlots(params: {
  farmerId: string;
  farmer?: FarmerProfile;
  plots: Plot[];
  plotServerLinks: Record<string, string>;
}): Promise<{ plotsProcessed: number; producerEvidence: boolean }> {
  let plotsProcessed = 0;
  for (const plot of params.plots) {
    if (!params.plotServerLinks[plot.id]?.trim()) continue;
    await enqueuePlotDependentSyncActions({
      localPlotId: plot.id,
      farmerId: params.farmerId,
    });
    plotsProcessed += 1;
  }

  const producerEvidence = await enqueueProducerSupportingEvidenceSync({
    farmerId: params.farmerId,
  });

  await enqueuePendingDeclarationAuditsForDevice({
    farmer: params.farmer,
    plots: params.plots,
  }).catch(() => undefined);

  return { plotsProcessed, producerEvidence };
}

export async function enqueueProducerSupportingEvidenceSync(params: {
  farmerId: string;
}): Promise<boolean> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) return false;

  const scopeId = producerEvidenceScopeId(farmerId);
  const items = await loadEvidenceForPlot(scopeId).catch(() => []);
  if (items.length === 0) return false;

  const reason = resolveDocumentUploadReason(null);
  const payloadJson = JSON.stringify({
    scope: 'producer',
    farmerId,
    plotId: scopeId,
    reason,
  });
  const dedupKey = pendingSyncDedupKey('evidence_sync', payloadJson);
  const pendingActions = await loadPendingSyncActions().catch(() => []);
  if (
    dedupKey &&
    pendingActions.some(
      (row) => pendingSyncDedupKey(row.actionType, row.payloadJson) === dedupKey,
    )
  ) {
    return false;
  }

  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'evidence_sync',
    payloadJson,
    lastError: null,
  });
  return true;
}
