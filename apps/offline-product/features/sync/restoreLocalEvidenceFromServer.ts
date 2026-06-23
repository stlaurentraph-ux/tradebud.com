import {
  fetchPlotSyncedEvidence,
  fetchPlotTenureVerification,
  type PlotSyncedEvidenceRecord,
} from '@/features/api/postPlot';
import { downloadEvidenceFileFromStorage } from '@/features/evidence/downloadEvidenceFromStorage';
import {
  isProducerEvidenceKind,
  producerEvidenceScopeId,
} from '@/features/evidence/evidenceScope';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { Plot } from '@/features/state/AppStateContext';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadEvidenceForPlot,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
  persistPlotEvidenceItem,
  persistPlotTitlePhoto,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
  type PlotTitlePhoto,
} from '@/features/state/persistence';

export type RestoreLocalEvidenceResult = {
  restoredCount: number;
  fetchFailed: boolean;
  skippedUnlinked: number;
  downloadFailed: number;
};

type ServerEvidenceCandidate = {
  storagePath: string;
  mimeType: string | null;
  label: string | null;
  kind: string;
  takenAt: number;
  serverPlotId: string;
};

function isImageMime(mimeType: string | null, storagePath: string): boolean {
  const hint = `${mimeType ?? ''} ${storagePath}`.toLowerCase();
  return (
    hint.includes('image/') ||
    hint.includes('.jpg') ||
    hint.includes('.jpeg') ||
    hint.includes('.png') ||
    hint.includes('.heic') ||
    hint.includes('.heif') ||
    hint.includes('.webp')
  );
}

function normalizeKind(raw: string): PlotEvidenceKind | 'land_title' {
  const kind = raw.trim();
  if (
    kind === 'fpic_repository' ||
    kind === 'protected_area_permit' ||
    kind === 'labor_evidence' ||
    kind === 'tenure_evidence' ||
    kind === 'land_title'
  ) {
    return kind;
  }
  return 'tenure_evidence';
}

function storagePathStored(
  storagePath: string,
  titlePhotos: readonly PlotTitlePhoto[],
  evidenceItems: readonly PlotEvidenceItem[],
): boolean {
  const trimmed = storagePath.trim();
  return (
    titlePhotos.some((row) => row.storagePath?.trim() === trimmed) ||
    evidenceItems.some((row) => row.storagePath?.trim() === trimmed)
  );
}

function candidatesFromSyncedEvidence(
  serverPlotId: string,
  rows: PlotSyncedEvidenceRecord[],
): ServerEvidenceCandidate[] {
  return rows.map((row) => ({
    storagePath: row.file_storage_key,
    mimeType: row.mime_type,
    label: row.evidence_kind,
    kind: row.evidence_kind,
    takenAt: Date.parse(row.updated_at) || Date.now(),
    serverPlotId,
  }));
}

function candidatesFromTenureVerification(
  serverPlotId: string,
  rows: Awaited<ReturnType<typeof fetchPlotTenureVerification>>,
): ServerEvidenceCandidate[] {
  return rows
    .map((row) => ({
      storagePath: row.storage_path?.trim() ?? '',
      mimeType: row.mime_type,
      label: row.evidence_label,
      kind: 'land_title',
      takenAt: Date.parse(row.created_at) || Date.now(),
      serverPlotId,
    }))
    .filter((row) => row.storagePath.length > 0);
}

function resolveLocalTargetPlotId(params: {
  kind: string;
  apiFarmerId: string;
  localPlotId: string;
}): string {
  const normalized = normalizeKind(params.kind);
  if (normalized === 'land_title') {
    return params.localPlotId;
  }
  if (isProducerEvidenceKind(normalized)) {
    return producerEvidenceScopeId(params.apiFarmerId);
  }
  return params.localPlotId;
}

/**
 * Pulls synced evidence metadata + file bytes from Tracebud/Supabase into local SQLite.
 * Never overwrites pending on-device uploads.
 */
export async function restoreLocalEvidenceFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<RestoreLocalEvidenceResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { restoredCount: 0, fetchFailed: false, skippedUnlinked: 0, downloadFailed: 0 };
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  const linkedServerPlotIds = new Set<string>();
  for (const plot of params.localPlots) {
    const serverPlotId = plotServerLinks[plot.id]?.trim();
    if (serverPlotId) linkedServerPlotIds.add(serverPlotId);
  }
  for (const row of backendPlots) {
    const serverPlotId = String((row as { id?: string }).id ?? '').trim();
    if (serverPlotId) linkedServerPlotIds.add(serverPlotId);
  }

  if (linkedServerPlotIds.size === 0) {
    return { restoredCount: 0, fetchFailed: false, skippedUnlinked: 0, downloadFailed: 0 };
  }

  let fetchFailed = false;
  let skippedUnlinked = 0;
  let downloadFailed = 0;
  let restoredCount = 0;

  const seenStoragePaths = new Set<string>();
  const candidates: ServerEvidenceCandidate[] = [];

  for (const serverPlotId of linkedServerPlotIds) {
    try {
      const [syncedRows, tenureRows] = await Promise.all([
        fetchPlotSyncedEvidence(serverPlotId),
        fetchPlotTenureVerification(serverPlotId),
      ]);
      for (const row of [
        ...candidatesFromSyncedEvidence(serverPlotId, syncedRows),
        ...candidatesFromTenureVerification(serverPlotId, tenureRows),
      ]) {
        const key = row.storagePath.trim();
        if (!key || seenStoragePaths.has(key)) continue;
        seenStoragePaths.add(key);
        candidates.push(row);
      }
    } catch {
      fetchFailed = true;
    }
  }

  for (const candidate of candidates) {
    const localPlotId = resolveLocalPlotIdForServerPlot({
      serverPlotId: candidate.serverPlotId,
      localPlots: params.localPlots,
      plotServerLinks,
      backendPlots,
    });
    if (!localPlotId) {
      skippedUnlinked += 1;
      continue;
    }

    const targetPlotId = resolveLocalTargetPlotId({
      kind: candidate.kind,
      apiFarmerId,
      localPlotId,
    });

    const [titlePhotos, evidenceItems] = await Promise.all([
      loadTitlePhotosForPlot(targetPlotId),
      loadEvidenceForPlot(targetPlotId),
    ]);

    if (storagePathStored(candidate.storagePath, titlePhotos, evidenceItems)) {
      continue;
    }

    const normalizedKind = normalizeKind(candidate.kind);
    const download = await downloadEvidenceFileFromStorage({
      storagePath: candidate.storagePath,
      localPlotId: targetPlotId,
      kind: normalizedKind,
      mimeType: candidate.mimeType,
      label: candidate.label,
    });
    if (!download.ok) {
      downloadFailed += 1;
      continue;
    }

    const takenAt = candidate.takenAt || Date.now();
    const persistedUri =
      download.localUri.startsWith('file://') ? download.localUri : download.remoteUrl;
    if (
      (normalizedKind === 'land_title' || normalizedKind === 'tenure_evidence') &&
      isImageMime(candidate.mimeType, candidate.storagePath)
    ) {
      await persistPlotTitlePhoto({
        plotId: targetPlotId,
        uri: persistedUri,
        takenAt,
        storagePath: download.storagePath,
      });
    } else {
      await persistPlotEvidenceItem({
        plotId: targetPlotId,
        kind:
          normalizedKind === 'land_title'
            ? 'tenure_evidence'
            : normalizedKind,
        uri: persistedUri,
        mimeType: candidate.mimeType,
        label: candidate.label,
        takenAt,
        storagePath: download.storagePath,
      });
    }

    restoredCount += 1;
  }

  return { restoredCount, fetchFailed, skippedUnlinked, downloadFailed };
}
