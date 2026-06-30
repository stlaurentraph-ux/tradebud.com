type PhotoDirection = 'north' | 'east' | 'south' | 'west' | null;

export type AuditPhotoPayload = {
  storagePath?: string;
  uri?: string;
  takenAt?: number | string;
  direction?: PhotoDirection;
};

type LocalGroundPhoto = {
  uri: string;
  takenAt: number;
  direction?: PhotoDirection;
};

type LocalTitlePhoto = {
  uri: string;
  storagePath?: string | null;
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

export function photoStorageKey(photo: AuditPhotoPayload): string {
  const path = photo.storagePath?.trim();
  if (path) return `path:${path}`;
  const uri = photo.uri?.trim();
  if (uri) return `uri:${uri}`;
  return '';
}

export function localPhotoMatches(
  existing: LocalGroundPhoto,
  candidate: AuditPhotoPayload,
  persistedUri: string,
): boolean {
  const path = candidate.storagePath?.trim();
  if (path && uriReferencesStoragePath(existing.uri, path)) return true;
  const uri = candidate.uri?.trim();
  if (uri && existing.uri.trim() === uri) return true;
  if (existing.uri.trim() === persistedUri.trim()) return true;
  const takenAtDelta = Math.abs(existing.takenAt - parseTakenAtMs(candidate.takenAt));
  if (
    candidate.direction &&
    existing.direction === candidate.direction &&
    takenAtDelta < 60_000
  ) {
    return true;
  }
  if (!candidate.direction && takenAtDelta < 60_000) {
    return true;
  }
  return false;
}

export function titlePhotoStored(
  existing: readonly LocalTitlePhoto[],
  storagePath: string | undefined,
  uri: string,
): boolean {
  const path = storagePath?.trim();
  if (path && existing.some((row) => row.storagePath?.trim() === path)) return true;
  if (path && existing.some((row) => uriReferencesStoragePath(row.uri, path))) return true;
  const remoteUri = uri.trim();
  if (remoteUri && existing.some((row) => row.uri.trim() === remoteUri)) return true;
  return false;
}

export function storagePathBasename(storagePath: string): string {
  const trimmed = storagePath.trim().replace(/\\/g, '/');
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

export function uriReferencesStoragePath(uri: string, storagePath: string | undefined): boolean {
  const path = storagePath?.trim();
  if (!path) return false;
  const normalizedUri = uri.trim().toLowerCase();
  const normalizedPath = path.toLowerCase();
  if (normalizedUri.includes(normalizedPath)) return true;
  const base = storagePathBasename(path).toLowerCase();
  return base.length > 3 && normalizedUri.includes(base);
}

type StorageBackedRow = {
  uri: string;
  storagePath?: string | null;
};

export function storagePathStored(
  storagePath: string,
  titlePhotos: readonly StorageBackedRow[],
  evidenceItems: readonly StorageBackedRow[],
): boolean {
  const trimmed = storagePath.trim();
  return (
    titlePhotos.some((row) => row.storagePath?.trim() === trimmed) ||
    titlePhotos.some((row) => uriReferencesStoragePath(row.uri, trimmed)) ||
    evidenceItems.some((row) => row.storagePath?.trim() === trimmed) ||
    evidenceItems.some((row) => uriReferencesStoragePath(row.uri, trimmed))
  );
}

export function capacityCappedMissing(
  unmatched: number,
  serverCount: number,
  localCount: number,
): number {
  return Math.min(unmatched, Math.max(0, serverCount - localCount));
}

export type AuditPhotoSyncRow = {
  event_type?: string;
  payload?: {
    kind?: string;
    plotId?: unknown;
    photos?: unknown;
  };
};

export function latestAuditPhotosByServerPlot(auditRows: readonly AuditPhotoSyncRow[]): {
  groundTruth: Map<string, AuditPhotoPayload[]>;
  landTitle: Map<string, AuditPhotoPayload[]>;
} {
  const groundTruth = new Map<string, AuditPhotoPayload[]>();
  const landTitle = new Map<string, AuditPhotoPayload[]>();

  for (const row of auditRows) {
    if (row.event_type !== 'plot_photos_synced' || !row.payload) continue;
    const kind = row.payload.kind;
    if (kind !== 'ground_truth' && kind !== 'land_title') continue;
    const serverPlotId = String(row.payload.plotId ?? '').trim();
    if (!serverPlotId) continue;
    const target = kind === 'ground_truth' ? groundTruth : landTitle;
    if (target.has(serverPlotId)) continue;
    const photos = row.payload.photos;
    if (!Array.isArray(photos) || photos.length === 0) continue;
    target.set(
      serverPlotId,
      photos.filter((photo): photo is AuditPhotoPayload => photo != null && typeof photo === 'object'),
    );
  }

  return { groundTruth, landTitle };
}
