import type { OfflineTilesBbox } from '@/features/offlineTiles/offlineTiles';
import { estimateTilesForBbox } from '@/features/offlineTiles/offlineTiles';

export type FieldEnumerationMappingRegion = {
  label: string;
  bbox: OfflineTilesBbox;
  campaignId?: string | null;
};

export const ENUMERATION_DISTRICT_ZOOMS = [12, 13, 14, 15] as const;
export const MOBILE_DATA_PACK_THRESHOLD_MB = 50;
export const AVG_TILE_BYTES = 18_000;

export function estimateDistrictPackSizeMb(
  bbox: OfflineTilesBbox,
  zooms: readonly number[] = ENUMERATION_DISTRICT_ZOOMS,
): number {
  const tiles = estimateTilesForBbox(bbox, [...zooms]);
  const bytes = tiles * AVG_TILE_BYTES;
  return Math.max(1, Math.round((bytes / (1024 * 1024)) * 10) / 10);
}

export function requiresWifiAckForPack(estimatedMb: number): boolean {
  return estimatedMb > MOBILE_DATA_PACK_THRESHOLD_MB;
}

export function buildDistrictPackId(region: FieldEnumerationMappingRegion): string {
  const slug = (region.campaignId ?? region.label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  return `enum-district-${slug}`;
}

export function bboxContainsRegion(outer: OfflineTilesBbox, inner: OfflineTilesBbox): boolean {
  return (
    inner.west >= outer.west &&
    inner.east <= outer.east &&
    inner.south >= outer.south &&
    inner.north <= outer.north
  );
}

export function capZoomLevelsForBbox(
  bbox: OfflineTilesBbox,
  zooms: readonly number[],
  maxTiles: number = 9000,
): number[] {
  const selected: number[] = [];
  for (const z of zooms) {
    const next = [...selected, z];
    if (estimateTilesForBbox(bbox, next) > maxTiles) {
      break;
    }
    selected.push(z);
  }
  return selected.length > 0 ? selected : [zooms[0]];
}
