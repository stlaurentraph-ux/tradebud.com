import {
  fetchPlotSyncedEvidence,
  fetchPlotTenureVerification,
} from '@/features/api/postPlot';
import type { Plot } from '@/features/state/AppStateContext';
import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  isPlotEvidencePendingUpload,
  isPlotGroundPhotoPendingUpload,
  isPlotTitlePhotoPendingUpload,
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
  updatePlotEvidenceAfterUpload,
  updatePlotGroundPhotoAfterUpload,
  updatePlotTitlePhotoAfterUpload,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

type AuditPhotoPayload = {
  storagePath?: string;
  uri?: string;
  takenAt?: number | string;
  direction?: string | null;
};

function parseTakenAtMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    if (/^\d{10,16}$/.test(raw.trim())) {
      const n = Number(raw.trim());
      return raw.trim().length > 10 ? n : n * 1000;
    }
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function takenAtClose(localMs: number, serverMs: number, toleranceMs = 120_000): boolean {
  if (!localMs || !serverMs) return false;
  return Math.abs(localMs - serverMs) <= toleranceMs;
}

function normalizeEvidenceKind(raw: string): PlotEvidenceKind | null {
  const kind = raw.trim();
  if (
    kind === 'fpic_repository' ||
    kind === 'protected_area_permit' ||
    kind === 'labor_evidence' ||
    kind === 'tenure_evidence'
  ) {
    return kind;
  }
  return null;
}

function auditPhotosForServerPlot(
  auditRows: AuditLogRow[],
  serverPlotId: string,
  kind: 'ground_truth' | 'land_title',
): AuditPhotoPayload[] {
  for (const row of auditRows) {
    if (row.event_type !== 'plot_photos_synced' || !row.payload) continue;
    if (String(row.payload.plotId ?? '').trim() !== serverPlotId) continue;
    if (row.payload.kind !== kind) continue;
    const photos = row.payload.photos;
    if (!Array.isArray(photos)) return [];
    return photos.filter((photo): photo is AuditPhotoPayload => photo != null && typeof photo === 'object');
  }
  return [];
}

async function markTitlePhotoFromServerPath(
  photoId: number,
  uri: string,
  storagePath: string,
): Promise<boolean> {
  await updatePlotTitlePhotoAfterUpload(photoId, { uri, storagePath }).catch(() => undefined);
  return true;
}

/**
 * Sets local storagePath markers when Tracebud already stores the file (no re-upload).
 */
export async function hydrateMediaUploadMarkersFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
  auditRows: AuditLogRow[];
}): Promise<{ marked: number; fetchFailed: boolean; plotMediaHydratedPlotIds: string[] }> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId || params.localPlots.length === 0) {
    return { marked: 0, fetchFailed: false, plotMediaHydratedPlotIds: [] };
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const linkedEntries: Array<{ localPlotId: string; serverPlotId: string }> = [];
  for (const plot of params.localPlots) {
    const serverPlotId = plotServerLinks[plot.id]?.trim();
    if (serverPlotId) linkedEntries.push({ localPlotId: plot.id, serverPlotId });
  }
  if (linkedEntries.length === 0) {
    return { marked: 0, fetchFailed: false, plotMediaHydratedPlotIds: [] };
  }

  let marked = 0;
  let fetchFailed = false;
  const plotMediaHydratedPlotIds: string[] = [];

  for (const { localPlotId, serverPlotId } of linkedEntries) {
    let syncedRows: Awaited<ReturnType<typeof fetchPlotSyncedEvidence>> = [];
    let tenureRows: Awaited<ReturnType<typeof fetchPlotTenureVerification>> = [];
    try {
      [syncedRows, tenureRows] = await Promise.all([
        fetchPlotSyncedEvidence(serverPlotId),
        fetchPlotTenureVerification(serverPlotId),
      ]);
    } catch {
      fetchFailed = true;
      continue;
    }
    plotMediaHydratedPlotIds.push(localPlotId);

    const titlePhotos = await loadTitlePhotosForPlot(localPlotId).catch(() => []);
    const pendingTitle = titlePhotos.filter(isPlotTitlePhotoPendingUpload);
    const serverTitlePaths = [
      ...tenureRows
        .map((row) => ({
          storagePath: row.storage_path?.trim() ?? '',
          takenAt: Date.parse(row.created_at) || 0,
        }))
        .filter((row) => row.storagePath.length > 0),
      ...auditPhotosForServerPlot(params.auditRows, serverPlotId, 'land_title')
        .map((photo) => ({
          storagePath: photo.storagePath?.trim() ?? '',
          takenAt: parseTakenAtMs(photo.takenAt),
        }))
        .filter((row) => row.storagePath.length > 0),
    ];
    const usedTitlePaths = new Set<string>();
    for (const photo of pendingTitle) {
      const match =
        serverTitlePaths.find(
          (row) =>
            !usedTitlePaths.has(row.storagePath) && takenAtClose(photo.takenAt, row.takenAt),
        ) ??
        (pendingTitle.length === serverTitlePaths.length
          ? serverTitlePaths.find((row) => !usedTitlePaths.has(row.storagePath))
          : undefined);
      if (!match) continue;
      usedTitlePaths.add(match.storagePath);
      if (await markTitlePhotoFromServerPath(photo.id, photo.uri, match.storagePath)) {
        marked += 1;
      }
    }

    const groundPhotos = await loadPhotosForPlot(localPlotId).catch(() => []);
    const pendingGround = groundPhotos.filter(isPlotGroundPhotoPendingUpload);
    const auditGround = auditPhotosForServerPlot(params.auditRows, serverPlotId, 'ground_truth');
    const usedGroundPaths = new Set<string>();
    for (const photo of pendingGround) {
      const match = auditGround.find((candidate) => {
        const path = candidate.storagePath?.trim() ?? '';
        if (!path || usedGroundPaths.has(path)) return false;
        if (photo.direction && candidate.direction === photo.direction) return true;
        return takenAtClose(photo.takenAt, parseTakenAtMs(candidate.takenAt));
      });
      const storagePath = match?.storagePath?.trim();
      if (!storagePath) continue;
      usedGroundPaths.add(storagePath);
      await updatePlotGroundPhotoAfterUpload(photo.id, {
        uri: photo.uri,
        storagePath,
      }).catch(() => undefined);
      marked += 1;
    }

    const evidenceItems = await loadEvidenceForPlot(localPlotId).catch(() => []);
    const pendingEvidence = evidenceItems.filter(isPlotEvidencePendingUpload);
    const usedEvidencePaths = new Set<string>();
    for (const item of pendingEvidence) {
      const match = syncedRows.find((row) => {
        const path = row.file_storage_key?.trim() ?? '';
        if (!path || usedEvidencePaths.has(path)) return false;
        const kind = normalizeEvidenceKind(row.evidence_kind);
        if (kind && kind !== item.kind) return false;
        return takenAtClose(item.takenAt, Date.parse(row.updated_at) || 0);
      });
      const storagePath = match?.file_storage_key?.trim();
      if (!storagePath) continue;
      usedEvidencePaths.add(storagePath);
      await updatePlotEvidenceAfterUpload(item.id, {
        uri: item.uri,
        storagePath,
      }).catch(() => undefined);
      marked += 1;
    }
  }

  return { marked, fetchFailed, plotMediaHydratedPlotIds };
}
