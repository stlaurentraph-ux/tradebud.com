import type { FieldEnumerationMappingRegion } from './field-enumeration-pack.types';

export function parseMappingRegionRow(row: {
  mapping_region_label?: string | null;
  mapping_region_west?: number | string | null;
  mapping_region_south?: number | string | null;
  mapping_region_east?: number | string | null;
  mapping_region_north?: number | string | null;
}): FieldEnumerationMappingRegion | null {
  const label = row.mapping_region_label?.trim();
  const west = Number(row.mapping_region_west);
  const south = Number(row.mapping_region_south);
  const east = Number(row.mapping_region_east);
  const north = Number(row.mapping_region_north);
  if (!label) return null;
  if (![west, south, east, north].every(Number.isFinite)) return null;
  if (west >= east || south >= north) return null;
  return {
    label,
    bbox: { west, south, east, north },
  };
}

export function bboxContainsRegion(
  outer: FieldEnumerationMappingRegion['bbox'],
  inner: FieldEnumerationMappingRegion['bbox'],
): boolean {
  return (
    inner.west >= outer.west &&
    inner.east <= outer.east &&
    inner.south >= outer.south &&
    inner.north <= outer.north
  );
}
