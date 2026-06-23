import { downloadEvidenceFileFromStorage } from '@/features/evidence/downloadEvidenceFromStorage';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { Plot } from '@/features/state/AppStateContext';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadPhotosForPlot,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
  persistPlotTitlePhoto,
  upsertPlotGroundPhoto,
  type PlotPhoto,
  type PlotTitlePhoto,
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

type GroundTruthPhotoPayload = {
  storagePath?: string;
  uri?: string;
  mimeType?: string | null;
  takenAt?: number | string;
  latitude?: number | null;
  longitude?: number | null;
  direction?: PlotPhoto['direction'];
  label?: string | null;
};

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

function normalizeDirection(raw: unknown): PlotPhoto['direction'] {
  if (raw === 'north' || raw === 'east' || raw === 'south' || raw === 'west') {
    return raw;
  }
  return null;
}

function photoStorageKey(photo: GroundTruthPhotoPayload): string {
  const path = photo.storagePath?.trim();
  if (path) return `path:${path}`;
  const uri = photo.uri?.trim();
  if (uri) return `uri:${uri}`;
  return '';
}

function localPhotoMatches(
  existing: PlotPhoto,
  candidate: GroundTruthPhotoPayload,
  persistedUri: string,
): boolean {
  const path = candidate.storagePath?.trim();
  if (path && existing.uri.includes(path)) return true;
  const uri = candidate.uri?.trim();
  if (uri && existing.uri.trim() === uri) return true;
  if (existing.uri.trim() === persistedUri.trim()) return true;
  if (
    candidate.direction &&
    existing.direction === candidate.direction &&
    Math.abs(existing.takenAt - parseTakenAtMs(candidate.takenAt)) < 60_000
  ) {
    return true;
  }
  return false;
}

function titlePhotoStored(
  existing: readonly PlotTitlePhoto[],
  storagePath: string | undefined,
  uri: string,
): boolean {
  const path = storagePath?.trim();
  if (path && existing.some((row) => row.storagePath?.trim() === path)) return true;
  return existing.some((row) => row.uri.trim() === uri.trim());
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

  const latestGroundTruth = new Map<string, GroundTruthPhotoPayload[]>();
  const latestLandTitle = new Map<string, GroundTruthPhotoPayload[]>();
  for (const row of auditRows) {
    if (row.event_type !== 'plot_photos_synced' || !row.payload) continue;
    const kind = row.payload.kind;
    if (kind !== 'ground_truth' && kind !== 'land_title') continue;
    const serverPlotId = String(row.payload.plotId ?? '').trim();
    if (!serverPlotId) continue;
    const targetMap = kind === 'ground_truth' ? latestGroundTruth : latestLandTitle;
    if (targetMap.has(serverPlotId)) continue;
    const photos = row.payload.photos;
    if (!Array.isArray(photos) || photos.length === 0) continue;
    targetMap.set(
      serverPlotId,
      photos.filter((photo): photo is GroundTruthPhotoPayload => photo != null && typeof photo === 'object'),
    );
  }

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
