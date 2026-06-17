import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { syncPlotLegalToBackend } from '@/features/api/postPlot';
import { resolveDocumentUploadReason } from '@/features/evidence/documentUploadReason';
import { syncLandTitlePhotosWithFiles } from '@/features/evidence/syncLandTitlePhotosWithFiles';
import { syncPlotEvidenceWithFiles } from '@/features/evidence/syncEvidenceWithFiles';
import {
  enqueuePendingSync,
  savePlotCadastralKey,
  savePlotTenure,
  type PlotEvidenceItem,
  type PlotTitlePhoto,
} from '@/features/state/persistence';

export { DEFAULT_DOCUMENT_UPLOAD_REASON, resolveDocumentUploadReason } from '@/features/evidence/documentUploadReason';

export type AutoUploadOutcome =
  | { status: 'uploaded'; uploadedCount: number }
  | { status: 'queued' }
  | { status: 'local_only'; reason: 'not_signed_in' | 'no_farmer' }
  | { status: 'skipped'; reason: 'no_documents' };

export async function autoUploadLandTitleDocuments(params: {
  localPlotId: string;
  serverPlotId: string | null;
  farmerId: string | undefined;
  titlePhotos: PlotTitlePhoto[];
  cadastralKey: string | null;
  informalTenure: boolean;
  informalTenureNote: string | null;
  customReason?: string | null;
}): Promise<AutoUploadOutcome> {
  if (params.titlePhotos.length === 0) {
    return { status: 'skipped', reason: 'no_documents' };
  }
  if (!params.farmerId) {
    return { status: 'local_only', reason: 'no_farmer' };
  }
  if (!hasSyncAuthSession()) {
    return { status: 'local_only', reason: 'not_signed_in' };
  }

  const reason = resolveDocumentUploadReason(params.customReason);
  await savePlotCadastralKey(params.localPlotId, params.cadastralKey);
  await savePlotTenure(params.localPlotId, {
    informalTenure: params.informalTenure,
    informalTenureNote: params.informalTenureNote,
  });

  if (!params.serverPlotId) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'photos_sync',
      payloadJson: JSON.stringify({
        legal: {
          cadastralKey: params.cadastralKey,
          informalTenure: params.informalTenure ? true : null,
          informalTenureNote: params.informalTenureNote,
          reason,
        },
        plotId: params.localPlotId,
        kind: 'land_title',
        photos: params.titlePhotos.map((p) => ({
          cadastralKey: params.cadastralKey,
          informalTenure: params.informalTenure ? true : null,
          informalTenureNote: params.informalTenureNote,
          uri: p.uri,
          takenAt: p.takenAt,
        })),
        note: 'Land title photos auto-upload from plot detail',
      }),
      lastError: 'Plot not on server — upload from My Plots first.',
    });
    return { status: 'queued' };
  }

  try {
    await syncPlotLegalToBackend({
      plotId: params.serverPlotId,
      cadastralKey: params.cadastralKey,
      informalTenure: params.informalTenure ? true : null,
      informalTenureNote: params.informalTenureNote,
      reason,
    });
    const summary = await syncLandTitlePhotosWithFiles({
      serverPlotId: params.serverPlotId,
      farmerId: params.farmerId,
      photos: params.titlePhotos,
      cadastralKey: params.cadastralKey,
      informalTenure: params.informalTenure ? true : null,
      informalTenureNote: params.informalTenureNote,
      note: 'Land title photos auto-upload from plot detail',
    });
    return { status: 'uploaded', uploadedCount: summary.uploadedCount };
  } catch (e) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'photos_sync',
      payloadJson: JSON.stringify({
        legal: {
          cadastralKey: params.cadastralKey,
          informalTenure: params.informalTenure ? true : null,
          informalTenureNote: params.informalTenureNote,
          reason,
        },
        plotId: params.localPlotId,
        kind: 'land_title',
        photos: params.titlePhotos.map((p) => ({
          cadastralKey: params.cadastralKey,
          informalTenure: params.informalTenure ? true : null,
          informalTenureNote: params.informalTenureNote,
          uri: p.uri,
          takenAt: p.takenAt,
        })),
        note: 'Land title photos auto-upload from plot detail',
      }),
      lastError: e instanceof Error ? e.message : String(e),
    });
    return { status: 'queued' };
  }
}

export async function autoUploadPlotEvidenceDocuments(params: {
  localPlotId: string;
  serverPlotId: string | null;
  farmerId: string | undefined;
  items: PlotEvidenceItem[];
  customReason?: string | null;
}): Promise<AutoUploadOutcome> {
  if (params.items.length === 0) {
    return { status: 'skipped', reason: 'no_documents' };
  }
  if (!params.farmerId) {
    return { status: 'local_only', reason: 'no_farmer' };
  }
  if (!hasSyncAuthSession()) {
    return { status: 'local_only', reason: 'not_signed_in' };
  }

  const reason = resolveDocumentUploadReason(params.customReason);

  if (!params.serverPlotId) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'evidence_sync',
      payloadJson: JSON.stringify({
        plotId: params.localPlotId,
        farmerId: params.farmerId,
        reason,
      }),
      lastError: 'Plot not on server — upload from My Plots first.',
    });
    return { status: 'queued' };
  }

  try {
    const summary = await syncPlotEvidenceWithFiles({
      localPlotId: params.localPlotId,
      serverPlotId: params.serverPlotId,
      farmerId: params.farmerId,
      items: params.items,
      reason,
      note: 'Evidence auto-upload from plot detail',
    });
    return { status: 'uploaded', uploadedCount: summary.uploadedCount };
  } catch (e) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'evidence_sync',
      payloadJson: JSON.stringify({
        plotId: params.localPlotId,
        farmerId: params.farmerId,
        reason,
      }),
      lastError: e instanceof Error ? e.message : String(e),
    });
    return { status: 'queued' };
  }
}
