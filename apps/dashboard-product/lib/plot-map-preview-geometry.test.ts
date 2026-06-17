import { describe, expect, it } from 'vitest';
import {
  buildPolygonSvgPath,
  clampPlotMapZoom,
  computePlotMapView,
  computePlotMapViewAtZoom,
  extractGeoJsonCoordinates,
  panPlotMapView,
  PLOT_MAP_MAX_ZOOM,
  projectLngLatToContainer,
} from './plot-map-preview-geometry';

describe('plot-map-preview-geometry', () => {
  it('extracts point coordinates', () => {
    const points = extractGeoJsonCoordinates({
      type: 'Point',
      coordinates: [30.06, -1.94],
    });
    expect(points).toEqual([{ lat: -1.94, lng: 30.06 }]);
  });

  it('extracts polygon outer ring', () => {
    const points = extractGeoJsonCoordinates({
      type: 'Polygon',
      coordinates: [
        [
          [30.061, -1.944],
          [30.062, -1.944],
          [30.062, -1.943],
          [30.061, -1.943],
          [30.061, -1.944],
        ],
      ],
    });
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ lat: -1.944, lng: 30.061 });
  });

  it('builds map view and svg path for polygon', () => {
    const points = extractGeoJsonCoordinates({
      type: 'Polygon',
      coordinates: [
        [
          [30.061, -1.944],
          [30.062, -1.944],
          [30.062, -1.943],
          [30.061, -1.943],
          [30.061, -1.944],
        ],
      ],
    });
    const view = computePlotMapView(points, 'polygon', 640, 280);
    expect(view).not.toBeNull();
    const path = buildPolygonSvgPath(points, view!, 640, 280);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
  });

  it('projects point inside container bounds', () => {
    const points = [{ lat: -1.94, lng: 30.06 }];
    const view = computePlotMapView(points, 'point', 640, 280);
    expect(view).not.toBeNull();
    const projected = projectLngLatToContainer(points[0], view!, 640, 280);
    expect(projected.x).toBeGreaterThan(0);
    expect(projected.x).toBeLessThan(640);
    expect(projected.y).toBeGreaterThan(0);
    expect(projected.y).toBeLessThan(280);
  });

  it('fits polygons up to zoom 19 when viewport allows', () => {
    const points = extractGeoJsonCoordinates({
      type: 'Polygon',
      coordinates: [
        [
          [30.061, -1.944],
          [30.06105, -1.944],
          [30.06105, -1.94395],
          [30.061, -1.94395],
          [30.061, -1.944],
        ],
      ],
    });
    const view = computePlotMapView(points, 'polygon', 1280, 960);
    expect(view?.zoom).toBe(PLOT_MAP_MAX_ZOOM);
  });

  it('pans and zooms viewport without losing center on zoom-at-center', () => {
    const center = { lat: -1.94, lng: 30.06 };
    const view = computePlotMapViewAtZoom(center, 17, 960, 480);
    const panned = panPlotMapView(view, 960, 480, 40, 20);
    expect(panned.center.lng).not.toBe(center.lng);
    const zoomed = computePlotMapViewAtZoom(panned.center, clampPlotMapZoom(panned.zoom + 1), 960, 480);
    expect(zoomed.zoom).toBe(panned.zoom + 1);
  });
});
