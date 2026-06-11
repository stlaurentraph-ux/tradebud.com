import {
  EUDR_DEFORESTATION_CUTOFF,
  MIN_GROUND_TRUTH_PHOTOS_FOR_REVIEW_CLEARANCE,
} from './plot-compliance-status';

/** Default capture radius for point plots when precision is unknown (metres). */
export const DEFAULT_POINT_PLOT_PHOTO_RADIUS_M = 25;

export type GroundTruthPhotoVerification = {
  totalCount: number;
  geoTaggedCount: number;
  geoVerifiedCount: number;
  timestampVerifiedCount: number;
  clearanceVerifiedCount: number;
  cutoffDate: string;
  minRequired: number;
  clearanceEligible: boolean;
};

export function parsePhotoWgs84(photo: unknown): { latitude: number; longitude: number } | null {
  if (!photo || typeof photo !== 'object') return null;
  const row = photo as Record<string, unknown>;
  const latRaw = row.latitude ?? row.lat;
  const lngRaw = row.longitude ?? row.lng ?? row.lon;
  const latitude = typeof latRaw === 'number' ? latRaw : Number(latRaw);
  const longitude = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function countGeoTaggedGroundTruthPhotos(photos: unknown[]): number {
  return photos.filter((photo) => parsePhotoWgs84(photo) != null).length;
}

export function parsePhotoTakenAtMs(photo: unknown): number | null {
  if (!photo || typeof photo !== 'object') return null;
  const row = photo as Record<string, unknown>;
  const raw = row.takenAt ?? row.taken_at ?? row.capturedAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1_000_000_000_000 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && /^\d{10,16}$/.test(raw.trim())) {
      return asNumber > 1_000_000_000_000 ? asNumber : asNumber * 1000;
    }
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isPhotoTakenAfterCutoff(
  photo: unknown,
  cutoffDate: string = EUDR_DEFORESTATION_CUTOFF,
): boolean {
  const takenAtMs = parsePhotoTakenAtMs(photo);
  if (takenAtMs == null) return false;
  const cutoffMs = Date.parse(`${cutoffDate}T23:59:59.999Z`);
  return Number.isFinite(cutoffMs) && takenAtMs > cutoffMs;
}

export function countTimestampVerifiedGroundTruthPhotos(
  photos: unknown[],
  cutoffDate: string = EUDR_DEFORESTATION_CUTOFF,
): number {
  return photos.filter((photo) => isPhotoTakenAfterCutoff(photo, cutoffDate)).length;
}

export function buildGroundTruthPhotoVerification(params: {
  totalCount: number;
  geoTaggedCount: number;
  geoVerifiedCount: number;
  timestampVerifiedCount: number;
  clearanceVerifiedCount: number;
  cutoffDate?: string;
  minRequired?: number;
}): GroundTruthPhotoVerification {
  const minRequired = params.minRequired ?? MIN_GROUND_TRUTH_PHOTOS_FOR_REVIEW_CLEARANCE;
  const cutoffDate = params.cutoffDate ?? EUDR_DEFORESTATION_CUTOFF;
  return {
    totalCount: params.totalCount,
    geoTaggedCount: params.geoTaggedCount,
    geoVerifiedCount: params.geoVerifiedCount,
    timestampVerifiedCount: params.timestampVerifiedCount,
    clearanceVerifiedCount: params.clearanceVerifiedCount,
    cutoffDate,
    minRequired,
    clearanceEligible: params.clearanceVerifiedCount >= minRequired,
  };
}
