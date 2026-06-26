import type { PlotMapTileProviderId } from '@/lib/plot-map-tile-provider';
import { plotMapTileUrl } from '@/lib/plot-map-tile-provider';

export type LatLng = { lat: number; lng: number };

export type PlotMapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type PlotMapView = {
  bounds: PlotMapBounds;
  zoom: number;
  center: LatLng;
};

export const PLOT_MAP_MAX_ZOOM = 19;
export const PLOT_MAP_MIN_ZOOM = 3;
export const PLOT_MAP_TILE_SIZE = 256;
export const PLOT_MAP_MAX_DEVICE_PIXEL_RATIO = 2;
export const ESRI_WORLD_IMAGERY_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';

const TILE_SIZE = PLOT_MAP_TILE_SIZE;

function ringToLatLng(ring: number[][]): LatLng[] {
  const points: LatLng[] = [];
  for (const coord of ring) {
    if (!Array.isArray(coord) || coord.length < 2) continue;
    const [lng, lat] = coord;
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({ lat, lng });
  }
  return points;
}

/** Extract display coordinates from GeoJSON Point or Polygon geometry. */
export function extractGeoJsonCoordinates(geometry: unknown): LatLng[] {
  if (!geometry || typeof geometry !== 'object') return [];
  const geo = geometry as { type?: string; coordinates?: unknown };

  if (geo.type === 'Point' && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
    const [lng, lat] = geo.coordinates;
    if (typeof lng === 'number' && typeof lat === 'number') {
      return [{ lat, lng }];
    }
    return [];
  }

  if (geo.type === 'Polygon' && Array.isArray(geo.coordinates)) {
    const outer = geo.coordinates[0];
    if (Array.isArray(outer)) return ringToLatLng(outer as number[][]);
  }

  if (geo.type === 'MultiPolygon' && Array.isArray(geo.coordinates)) {
    const firstPoly = geo.coordinates[0];
    if (Array.isArray(firstPoly) && Array.isArray(firstPoly[0])) {
      return ringToLatLng(firstPoly[0] as number[][]);
    }
  }

  return [];
}

export function computeBounds(points: LatLng[], kind: 'point' | 'polygon' | 'unknown'): PlotMapBounds | null {
  if (points.length === 0) return null;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  const latPad = Math.max((maxLat - minLat) * 0.35, kind === 'point' ? 0.0015 : 0.0008);
  const lngPad = Math.max((maxLng - minLng) * 0.35, kind === 'point' ? 0.0015 : 0.0008);

  if (kind === 'point' || minLat === maxLat) {
    minLat -= latPad;
    maxLat += latPad;
  }
  if (kind === 'point' || minLng === maxLng) {
    minLng -= lngPad;
    maxLng += lngPad;
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function lngLatToWorldPx(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function worldPxToLngLat(x: number, y: number, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

export function clampPlotMapZoom(zoom: number): number {
  return Math.min(Math.max(zoom, PLOT_MAP_MIN_ZOOM), PLOT_MAP_MAX_ZOOM);
}

export function resolvePlotMapDevicePixelRatio(devicePixelRatio = 1): number {
  return Math.min(Math.max(devicePixelRatio, 1), PLOT_MAP_MAX_DEVICE_PIXEL_RATIO);
}

export function boundsFromViewport(
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): PlotMapBounds {
  const centerPx = lngLatToWorldPx(center.lng, center.lat, zoom);
  const northWest = worldPxToLngLat(centerPx.x - width / 2, centerPx.y - height / 2, zoom);
  const southEast = worldPxToLngLat(centerPx.x + width / 2, centerPx.y + height / 2, zoom);
  return {
    minLat: southEast.lat,
    maxLat: northWest.lat,
    minLng: northWest.lng,
    maxLng: southEast.lng,
  };
}

export function computePlotMapViewAtZoom(
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): PlotMapView {
  const clampedZoom = clampPlotMapZoom(zoom);
  return {
    center,
    zoom: clampedZoom,
    bounds: boundsFromViewport(center, clampedZoom, width, height),
  };
}

export function panPlotMapView(
  view: PlotMapView,
  width: number,
  height: number,
  deltaX: number,
  deltaY: number,
): PlotMapView {
  const lngSpan = view.bounds.maxLng - view.bounds.minLng;
  const latSpan = view.bounds.maxLat - view.bounds.minLat;
  const bounds: PlotMapBounds = {
    minLng: view.bounds.minLng - (deltaX / width) * lngSpan,
    maxLng: view.bounds.maxLng - (deltaX / width) * lngSpan,
    minLat: view.bounds.minLat + (deltaY / height) * latSpan,
    maxLat: view.bounds.maxLat + (deltaY / height) * latSpan,
  };
  return {
    zoom: view.zoom,
    bounds,
    center: {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    },
  };
}

function fitZoom(bounds: PlotMapBounds, width: number, height: number): number {
  for (let zoom = PLOT_MAP_MAX_ZOOM; zoom >= PLOT_MAP_MIN_ZOOM; zoom -= 1) {
    const nw = lngLatToWorldPx(bounds.minLng, bounds.maxLat, zoom);
    const se = lngLatToWorldPx(bounds.maxLng, bounds.minLat, zoom);
    if (se.x - nw.x <= width * 0.88 && se.y - nw.y <= height * 0.88) {
      return zoom;
    }
  }
  return PLOT_MAP_MIN_ZOOM;
}

export function computePlotMapView(
  points: LatLng[],
  kind: 'point' | 'polygon' | 'unknown',
  width = 640,
  height = 280,
): PlotMapView | null {
  const bounds = computeBounds(points, kind);
  if (!bounds) return null;

  const zoom = fitZoom(bounds, width, height);
  return {
    bounds,
    zoom,
    center: {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    },
  };
}

export function projectLngLatToContainer(
  point: LatLng,
  view: PlotMapView,
  width: number,
  height: number,
): { x: number; y: number } {
  const nw = lngLatToWorldPx(view.bounds.minLng, view.bounds.maxLat, view.zoom);
  const se = lngLatToWorldPx(view.bounds.maxLng, view.bounds.minLat, view.zoom);
  const world = lngLatToWorldPx(point.lng, point.lat, view.zoom);
  const spanX = Math.max(se.x - nw.x, 1);
  const spanY = Math.max(se.y - nw.y, 1);
  return {
    x: ((world.x - nw.x) / spanX) * width,
    y: ((world.y - nw.y) / spanY) * height,
  };
}

export type MapTileDescriptor = { url: string; left: number; top: number; width: number; height: number };

export function buildMapTiles(
  view: PlotMapView,
  width: number,
  height: number,
  tileProvider: PlotMapTileProviderId = 'esri',
): MapTileDescriptor[] {
  const nw = lngLatToWorldPx(view.bounds.minLng, view.bounds.maxLat, view.zoom);
  const se = lngLatToWorldPx(view.bounds.maxLng, view.bounds.minLat, view.zoom);
  const spanX = Math.max(se.x - nw.x, 1);
  const spanY = Math.max(se.y - nw.y, 1);

  const minTileX = Math.floor(nw.x / TILE_SIZE);
  const maxTileX = Math.floor(se.x / TILE_SIZE);
  const minTileY = Math.floor(nw.y / TILE_SIZE);
  const maxTileY = Math.floor(se.y / TILE_SIZE);

  const tiles: MapTileDescriptor[] = [];
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const tileLeftWorld = tileX * TILE_SIZE;
      const tileTopWorld = tileY * TILE_SIZE;
      const left = ((tileLeftWorld - nw.x) / spanX) * width;
      const top = ((tileTopWorld - nw.y) / spanY) * height;
      const tileWidth = (TILE_SIZE / spanX) * width;
      const tileHeight = (TILE_SIZE / spanY) * height;
      tiles.push({
        url: plotMapTileUrl(tileProvider, view.zoom, tileY, tileX),
        left,
        top,
        width: tileWidth,
        height: tileHeight,
      });
    }
  }
  return tiles;
}

export function buildPolygonSvgPath(
  points: LatLng[],
  view: PlotMapView,
  width: number,
  height: number,
): string {
  if (points.length < 2) return '';
  const projected = points.map((point) => projectLngLatToContainer(point, view, width, height));
  const [first, ...rest] = projected;
  const segments = rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${segments} Z`;
}
