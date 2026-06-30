import { downloadEvidenceFileFromStorage } from '@/features/evidence/downloadEvidenceFromStorage';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { Plot } from '@/features/state/AppStateContext';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  latestAuditPhotosByServerPlot,
  localPhotoMatches,
  photoStorageKey,
  titlePhotoStored,
  type AuditPhotoPayload,
} from '@/features/sync/mediaPhotoMatch';
import {
  loadPhotosForPlot,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
  persistPlotTitlePhoto,
  upsertPlotGroundPhoto,
  type PlotPhoto,
} from '@/features/state/persistence';

export type RestoreLocalGroundTruthPhotosResult = {
  restoredCount: number;
  fetchFailed: boolean;
  downloadFailed: number;
  skippedUnlinked: number;
};

export type RestoreLocalPlotPhotosFromAuditResult = {
  groundTruthRestored: number;
  landTitleRestored: number;
  fetchFailed: boolean;
  downloadFailed: number;
  skippedUnlinked: number;
};

type GroundTruthPhotoPayload = AuditPhotoPayload & {
  mimeType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
};

function normalizeDirection(raw: unknown): PlotPhoto['direction'] {
  if (raw === 'north' || raw === 'east' || raw === 'south' || raw === 'west') {
    return raw;
  }
  return null;
}

function parseTakenAtMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    if (/^\d{10,16}$/.test(raw.trim())) {
      const n = Number(raw.trim());
      return raw.trim().length > 10 ? n : n * 1000;
    }
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : Date.now();
  }
  return Date.now();
}

async function downloadAuditPhotoUri(params: {
  photo: GroundTruthPhotoPayload;
  localPlotId: string;
  kind: 'ground_truth' | 'land_title';
}): Promise<{ ok: true; uri: string; storagePath: string | null } | { ok: false }> {
  const storagePath = params.photo.storagePath?.trim();
  const remoteUri = params.photo.uri?.trim();
  if (!storagePath && !remoteUri) {
    return { ok: false };
  }
  if (!storagePath) {
    return { ok: true, uri: remoteUri!, storagePath: null };
  }

  const download = await downloadEvidenceFileFromStorage({
    storagePath,
    localPlotId: params.localPlotId,
    kind: params.kind,
    mimeType: params.photo.mimeType ?? null,
    label: params.photo.label ?? `${params.kind}_photo`,
  });
  if (!download.ok) {
    if (remoteUri) return { ok: true, uri: remoteUri, storagePath };
    return { ok: false };
  }
  return {
    ok: true,
    uri: download.localUri.startsWith('file://') ? download.localUri : download.remoteUrl,
    storagePath: download.storagePath,
  };
}

/**
 * Pulls ground-truth and land-title photos from plot_photos_synced audit events.
 */
export async function restoreLocalPlotPhotosFromServerAudit(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<RestoreLocalPlotPhotosFromAuditResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId || params.localPlots.length === 0) {
    return {
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
      skippedUnlinked: 0,
    };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer(
      [apiFarmerId, ...params.ownedFarmerIds],
      400,
      ['plot_photos_synced'],
    );
  } catch {
    return {
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: true,
      downloadFailed: 0,
      skippedUnlinked: 0,
    };
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  const { groundTruth: latestGroundTruth, landTitle: latestLandTitle } =
    latestAuditPhotosByServerPlot(auditRows);

  let groundTruthRestored = 0;
  let landTitleRestored = 0;
  let downloadFailed = 0;
  let skippedUnlinked = 0;

  async function restoreKind(
    kind: 'ground_truth' | 'land_title',
    latestByServerPlot: Map<string, GroundTruthPhotoPayload[]>,
    onRestored: () => void,
  ) {
    for (const [serverPlotId, photos] of latestByServerPlot) {
      const localPlotId = resolveLocalPlotIdForServerPlot({
        serverPlotId,
        localPlots: params.localPlots,
        plotServerLinks,
        backendPlots,
      });
      if (!localPlotId) {
        skippedUnlinked += photos.length;
        continue;
      }

      const existingGround = kind === 'ground_truth' ? await loadPhotosForPlot(localPlotId) : [];
      const existingTitle = kind === 'land_title' ? await loadTitlePhotosForPlot(localPlotId) : [];
      const seenKeys = new Set<string>();

      for (const photo of photos) {
        const key = photoStorageKey(photo);
        if (!key || seenKeys.has(key)) continue;
        seenKeys.add(key);

        const remoteUri = photo.uri?.trim() ?? '';
        if (kind === 'ground_truth') {
          if (existingGround.some((row) => localPhotoMatches(row, photo, remoteUri))) {
            continue;
          }
        } else if (titlePhotoStored(existingTitle, photo.storagePath, remoteUri)) {
          continue;
        }

        const downloaded = await downloadAuditPhotoUri({ photo, localPlotId, kind });
        if (!downloaded.ok) {
          downloadFailed += 1;
          continue;
        }

        const takenAt = parseTakenAtMs(photo.takenAt);

        if (kind === 'ground_truth') {
          if (existingGround.some((row) => localPhotoMatches(row, photo, downloaded.uri))) {
            continue;
          }
          await upsertPlotGroundPhoto({
            plotId: localPlotId,
            uri: downloaded.uri,
            takenAt,
            latitude: typeof photo.latitude === 'number' ? photo.latitude : null,
            longitude: typeof photo.longitude === 'number' ? photo.longitude : null,
            direction: normalizeDirection(photo.direction),
          });
          onRestored();
          continue;
        }

        if (titlePhotoStored(existingTitle, downloaded.storagePath ?? undefined, downloaded.uri)) {
          continue;
        }
        await persistPlotTitlePhoto({
          plotId: localPlotId,
          uri: downloaded.uri,
          takenAt,
          storagePath: downloaded.storagePath,
        });
        onRestored();
      }
    }
  }

  await restoreKind('ground_truth', latestGroundTruth, () => {
    groundTruthRestored += 1;
  });
  await restoreKind('land_title', latestLandTitle, () => {
    landTitleRestored += 1;
  });

  return {
    groundTruthRestored,
    landTitleRestored,
    fetchFailed: false,
    downloadFailed,
    skippedUnlinked,
  };
}

/** @deprecated Prefer restoreLocalPlotPhotosFromServerAudit */
export async function restoreLocalGroundTruthPhotosFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<RestoreLocalGroundTruthPhotosResult> {
  const result = await restoreLocalPlotPhotosFromServerAudit(params);
  return {
    restoredCount: result.groundTruthRestored,
    fetchFailed: result.fetchFailed,
    downloadFailed: result.downloadFailed,
    skippedUnlinked: result.skippedUnlinked,
  };
}
