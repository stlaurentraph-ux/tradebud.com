import { describe, expect, it } from 'vitest';
import {
  mapServerPlotRowToLocalPlot,
  parsePlotPointsFromGeoJson,
  resolveLocalPlotIdFromServerRow,
  resolveServerPlotDisplayName,
} from './localPlotFromServerGeometry';

describe('parsePlotPointsFromGeoJson', () => {
  it('parses point geometry', () => {
    const points = parsePlotPointsFromGeoJson(
      { type: 'Point', coordinates: [30.123456, -1.234567] },
      'point',
    );
    expect(points).toEqual([{ latitude: -1.234567, longitude: 30.123456 }]);
  });

  it('parses polygon geometry and drops closing duplicate', () => {
    const points = parsePlotPointsFromGeoJson(
      {
        type: 'Polygon',
        coordinates: [
          [
            [30, -1],
            [30.001, -1],
            [30.001, -1.001],
            [30, -1],
          ],
        ],
      },
      'polygon',
    );
    expect(points).toHaveLength(3);
    expect(points?.[0]).toEqual({ latitude: -1, longitude: 30 });
  });
});

describe('mapServerPlotRowToLocalPlot', () => {
  it('uses client_plot_id as local id and display name from name column', () => {
    const plot = mapServerPlotRowToLocalPlot(
      {
        id: 'server-1',
        client_plot_id: 'local-abc-1234567890',
        name: 'Hector block A',
        kind: 'polygon',
        area_ha: 1.25,
        created_at: '2026-01-15T10:00:00.000Z',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [30, -1],
              [30.001, -1],
              [30.001, -1.001],
              [30, -1],
            ],
          ],
        },
      },
      'farmer-1',
    );
    expect(plot?.id).toBe('local-abc-1234567890');
    expect(plot?.name).toBe('Hector block A');
    expect(plot?.farmerId).toBe('farmer-1');
    expect(plot?.areaHectares).toBe(1.25);
    expect(plot?.points).toHaveLength(3);
  });

  it('returns null when geometry is missing', () => {
    expect(
      mapServerPlotRowToLocalPlot(
        { id: 'server-1', client_plot_id: 'local-1', name: 'Plot 1', kind: 'point' },
        'farmer-1',
      ),
    ).toBeNull();
  });
});

describe('resolveLocalPlotIdFromServerRow', () => {
  it('prefers client_plot_id over server id', () => {
    expect(
      resolveLocalPlotIdFromServerRow({ id: 'server-1', client_plot_id: 'local-1' }),
    ).toBe('local-1');
  });
});

describe('resolveServerPlotDisplayName', () => {
  it('falls back when name equals client id', () => {
    expect(
      resolveServerPlotDisplayName({
        id: 'server-1',
        client_plot_id: 'local-abc-1234567890',
        name: 'local-abc-1234567890',
      }),
    ).toBe('Plot local-ab');
  });
});
