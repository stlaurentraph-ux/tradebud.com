import { BadRequestException } from '@nestjs/common';

/** EUDR / Tracebud product policy — polygon required at or above this area. */
export const POLYGON_REQUIRED_MIN_AREA_HA = 4;

/** Spec §19 / risk_engine_profiles default for POINT screening footprints. */
export const POINT_BUFFER_HA_DEFAULT = 1.0;

const GEO_103_MESSAGE =
  'GEO-103: Plots of 4 hectares or more must use polygon geometry (perimeter boundary), not a point centroid.';

export function resolvePointBufferHa(): number {
  const raw = process.env.POINT_BUFFER_HA_DEFAULT ?? process.env.GFW_POINT_BUFFER_HA;
  if (raw == null || raw.trim() === '') {
    return POINT_BUFFER_HA_DEFAULT;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : POINT_BUFFER_HA_DEFAULT;
}

/** Radius (metres) for a circular geography buffer matching the target hectare footprint. */
export function pointBufferRadiusMeters(bufferHa: number = resolvePointBufferHa()): number {
  const ha = bufferHa > 0 ? bufferHa : POINT_BUFFER_HA_DEFAULT;
  return Math.sqrt((ha * 10_000) / Math.PI);
}

export function effectivePlotAreaHa(params: {
  declaredAreaHa?: number | null;
  computedAreaHa?: number | null;
}): number | null {
  const declared =
    params.declaredAreaHa != null && Number.isFinite(params.declaredAreaHa)
      ? params.declaredAreaHa
      : null;
  const computed =
    params.computedAreaHa != null && Number.isFinite(params.computedAreaHa)
      ? params.computedAreaHa
      : null;
  if (declared == null && computed == null) return null;
  if (declared == null) return computed;
  if (computed == null) return declared;
  return Math.max(declared, computed);
}

export function requiresPolygonGeometry(areaHa: number | null | undefined): boolean {
  return areaHa != null && Number.isFinite(areaHa) && areaHa >= POLYGON_REQUIRED_MIN_AREA_HA;
}

export function assertPointGeometryAllowed(params: {
  declaredAreaHa?: number | null;
  computedAreaHa?: number | null;
}): void {
  const areaHa = effectivePlotAreaHa(params);
  if (requiresPolygonGeometry(areaHa)) {
    throw new BadRequestException(GEO_103_MESSAGE);
  }
}
