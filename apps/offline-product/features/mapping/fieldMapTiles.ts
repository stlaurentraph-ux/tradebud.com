import { getOfflineTilesUrlTemplate } from '@/features/offlineTiles/offlineTiles';

/**
 * Satellite field imagery for plot capture (not Apple/Google street basemaps).
 * Default: Esri World Imagery — global aerial/satellite tiles suitable for field boundaries.
 * Override with EXPO_PUBLIC_FIELD_MAP_TILE_URL (XYZ template with {z}/{x}/{y}).
 */
export const DEFAULT_FIELD_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const FIELD_MAP_TILE_MAX_ZOOM = 19;

export type FieldMapTileMode = 'online' | 'offline' | 'none';

export function getOnlineFieldMapTileUrlTemplate(): string {
  const override = process.env.EXPO_PUBLIC_FIELD_MAP_TILE_URL?.trim();
  return override || DEFAULT_FIELD_MAP_TILE_URL;
}

export function buildFieldMapTileUrl(z: number, x: number, y: number): string {
  return getOnlineFieldMapTileUrlTemplate()
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
}

export function resolveFieldMapTileMode(params: {
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
}): FieldMapTileMode {
  if (params.lowDataMap) return 'none';
  if (params.offlineTilesEnabled) return 'offline';
  return 'online';
}

export function getFieldMapUrlTemplate(
  mode: FieldMapTileMode,
  packId?: string | null,
): string | null {
  if (mode === 'none') return null;
  if (mode === 'offline') return getOfflineTilesUrlTemplate(packId ?? undefined);
  return getOnlineFieldMapTileUrlTemplate();
}

/** Hide Apple/Google POI chrome when Esri tiles are the basemap. */
export const FIELD_MAP_VIEW_UI_PROPS = {
  showsCompass: false,
  showsScale: false,
  showsBuildings: false,
  showsTraffic: false,
  showsIndoors: false,
  showsPointsOfInterest: false,
} as const;

/** Interactive capture maps — pinch zoom / pan without parent scroll stealing gestures. */
export const FIELD_MAP_CAPTURE_UI_PROPS = {
  ...FIELD_MAP_VIEW_UI_PROPS,
  zoomEnabled: true,
  scrollEnabled: true,
  rotateEnabled: false,
  pitchEnabled: false,
  showsUserLocation: false,
  showsMyLocationButton: false,
} as const;

/** MapView must hide the native street basemap when satellite tiles are shown. */
export function fieldMapUsesCustomTiles(mode: FieldMapTileMode): boolean {
  return mode !== 'none';
}
