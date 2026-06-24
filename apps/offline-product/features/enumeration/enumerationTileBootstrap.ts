import type { FieldEnumerationMappingRegion } from '@/features/enumeration/fieldEnumerationPackTypes';
export type { FieldEnumerationMappingRegion };
export type OfflineTilesBbox = { west: number; south: number; east: number; north: number };
function lonToTileX(lon: number, z: number) { return Math.floor(((lon + 180) / 360) * Math.pow(2, z)); }
function latToTileY(lat: number, z: number) {
  const latRad = (lat * Math.PI) / 180; const n = Math.pow(2, z);
  return Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
}
function estimateTilesForBbox(bbox: OfflineTilesBbox, zooms: number[]) {
  let total = 0;
  for (const z of zooms) {
    total += (lonToTileX(bbox.east, z) - lonToTileX(bbox.west, z) + 1) * (latToTileY(bbox.south, z) - latToTileY(bbox.north, z) + 1);
  }
  return total;
}
export const ENUMERATION_DISTRICT_ZOOMS = [12, 13, 14, 15] as const;
export const MOBILE_DATA_PACK_THRESHOLD_MB = 50;
export const AVG_TILE_BYTES = 18_000;
export function estimateDistrictPackSizeMb(bbox: OfflineTilesBbox, zooms: readonly number[] = ENUMERATION_DISTRICT_ZOOMS) {
  return Math.max(1, Math.round((estimateTilesForBbox(bbox, [...zooms]) * AVG_TILE_BYTES / (1024 * 1024)) * 10) / 10);
}
export function requiresWifiAckForPack(estimatedMb: number) { return estimatedMb > MOBILE_DATA_PACK_THRESHOLD_MB; }
export function buildDistrictPackId(region: FieldEnumerationMappingRegion & { campaignId?: string | null }) {
  return `enum-district-${(region.campaignId ?? region.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
}
export function bboxContainsRegion(outer: OfflineTilesBbox, inner: OfflineTilesBbox) {
  return inner.west >= outer.west && inner.east <= outer.east && inner.south >= outer.south && inner.north <= outer.north;
}
export function capZoomLevelsForBbox(bbox: OfflineTilesBbox, zooms: readonly number[], maxTiles = 9000) {
  const selected: number[] = [];
  for (const z of zooms) { const next = [...selected, z]; if (estimateTilesForBbox(bbox, next) > maxTiles) break; selected.push(z); }
  return selected.length ? selected : [zooms[0]];
}
