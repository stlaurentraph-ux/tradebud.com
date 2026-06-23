import { downloadEvidenceFileFromStorage } from '@/features/evidence/downloadEvidenceFromStorage';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { Plot } from '@/features/state/AppStateContext';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadPhotosForPlot,
  loadPlotServerLinks,
  upsertPlotGroundPhoto,
  type PlotPhoto,
} from '@/features/state/persistence';

export type RestoreLocalGroundTruthPhotosResult = {
  restoredCount: number;
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

/**
 * Pulls ground-truth field photos from server audit_log into local SQLite.
 * Uses the latest plot_photos_synced (ground_truth) event per server plot.
 */
export async function restoreLocalGroundTruthPhotosFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
}): Promise<RestoreLocalGroundTruthPhotosResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId || params.localPlots.length === 0) {
    return { restoredCount: 0, fetchFailed: false, downloadFailed: 0, skippedUnlinked: 0 };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer(
      [apiFarmerId, ...params.ownedFarmerIds],
      400,
      ['plot_photos_synced'],
    );
  } catch {
    return { restoredCount: 0, fetchFailed: true, downloadFailed: 0, skippedUnlinked: 0 };
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  const latestByServerPlot = new Map<string, GroundTruthPhotoPayload[]>();
  for (const row of auditRows) {
    if (row.event_type !== 'plot_photos_synced' || !row.payload) continue;
    if (row.payload.kind !== 'ground_truth') continue;
    const serverPlotId = String(row.payload.plotId ?? '').trim();
    if (!serverPlotId || latestByServerPlot.has(serverPlotId)) continue;
    const photos = row.payload.photos;
    if (!Array.isArray(photos) || photos.length === 0) continue;
    latestByServerPlot.set(
      serverPlotId,
      photos.filter((photo): photo is GroundTruthPhotoPayload => photo != null && typeof photo === 'object'),
    );
  }

  let restoredCount = 0;
  let downloadFailed = 0;
  let skippedUnlinked = 0;

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

    const existingPhotos = await loadPhotosForPlot(localPlotId);
    const seenKeys = new Set<string>();

    for (const photo of photos) {
      const key = photoStorageKey(photo);
      if (!key || seenKeys.has(key)) continue;
      seenKeys.add(key);

      const storagePath = photo.storagePath?.trim();
      const remoteUri = photo.uri?.trim();
      if (!storagePath && !remoteUri) continue;

      let persistedUri = remoteUri ?? '';
      if (storagePath) {
        const download = await downloadEvidenceFileFromStorage({
          storagePath,
          localPlotId,
          kind: 'ground_truth',
          mimeType: photo.mimeType ?? null,
          label: photo.label ?? 'ground_truth_photo',
        });
        if (!download.ok) {
          if (remoteUri) {
            persistedUri = remoteUri;
          } else {
            downloadFailed += 1;
            continue;
          }
        } else {
          persistedUri = download.localUri.startsWith('file://')
            ? download.localUri
            : download.remoteUrl;
        }
      }

      if (
        existingPhotos.some((row) => localPhotoMatches(row, photo, persistedUri))
      ) {
        continue;
      }

      const takenAt = parseTakenAtMs(photo.takenAt);
      const direction = normalizeDirection(photo.direction);
      await upsertPlotGroundPhoto({
        plotId: localPlotId,
        uri: persistedUri,
        takenAt,
        latitude: typeof photo.latitude === 'number' ? photo.latitude : null,
        longitude: typeof photo.longitude === 'number' ? photo.longitude : null,
        direction,
      });
      restoredCount += 1;
    }
  }

  return { restoredCount, fetchFailed: false, downloadFailed, skippedUnlinked };
}
