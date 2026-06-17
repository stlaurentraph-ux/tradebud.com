import type { OfflineTilesBbox, OfflineTilesPackMeta } from './offlineTiles';

export type ManualTraceImagerySource = 'esri_online' | 'offline_pack';

export type ManualTraceImageryBlockReason =
  | 'low_data_map'
  | 'no_imagery'
  | 'pack_not_covering';

export type ManualTraceImageryAssessment =
  | {
      allowed: true;
      imagerySource: ManualTraceImagerySource;
      packId: string | null;
    }
  | {
      allowed: false;
      code: 'GEO-108';
      reason: ManualTraceImageryBlockReason;
    };

export function bboxContainsCoordinate(
  bbox: OfflineTilesBbox,
  latitude: number,
  longitude: number,
): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  return (
    longitude >= bbox.west &&
    longitude <= bbox.east &&
    latitude >= bbox.south &&
    latitude <= bbox.north
  );
}

export function findPackCoveringCoordinate(
  packs: OfflineTilesPackMeta[],
  latitude: number,
  longitude: number,
  preferredPackId?: string | null,
): OfflineTilesPackMeta | null {
  if (preferredPackId) {
    const preferred = packs.find((pack) => pack.id === preferredPackId);
    if (preferred && bboxContainsCoordinate(preferred.bbox, latitude, longitude)) {
      return preferred;
    }
  }

  for (const pack of packs) {
    if (bboxContainsCoordinate(pack.bbox, latitude, longitude)) {
      return pack;
    }
  }

  return null;
}

export async function assessManualTraceImageryAvailability(params: {
  latitude: number;
  longitude: number;
  lowDataMap: boolean;
  activePackId?: string | null;
  listPacks?: () => Promise<OfflineTilesPackMeta[]>;
  pingOnlineImagery?: () => Promise<boolean>;
}): Promise<ManualTraceImageryAssessment> {
  if (params.lowDataMap) {
    return { allowed: false, code: 'GEO-108', reason: 'low_data_map' };
  }

  const pingOnline = params.pingOnlineImagery ?? (async () => false);
  if (await pingOnline()) {
    return { allowed: true, imagerySource: 'esri_online', packId: null };
  }

  const packs = params.listPacks ? await params.listPacks() : [];
  const covering = findPackCoveringCoordinate(
    packs,
    params.latitude,
    params.longitude,
    params.activePackId,
  );
  if (covering) {
    return { allowed: true, imagerySource: 'offline_pack', packId: covering.id };
  }

  return { allowed: false, code: 'GEO-108', reason: 'no_imagery' };
}

/** Build a download bbox around a field coordinate (~3 km window). */
export function bboxAroundCoordinate(
  latitude: number,
  longitude: number,
  deltaDegrees: number = 0.03,
): OfflineTilesBbox {
  return {
    west: longitude - deltaDegrees,
    east: longitude + deltaDegrees,
    south: latitude - deltaDegrees,
    north: latitude + deltaDegrees,
  };
}
