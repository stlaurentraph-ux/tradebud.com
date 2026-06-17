import { describe, expect, it } from 'vitest';

import {
  assessManualTraceImageryAvailability,
  bboxAroundCoordinate,
  bboxContainsCoordinate,
  findPackCoveringCoordinate,
} from './manualTraceImagery';
import type { OfflineTilesPackMeta } from './offlineTiles';

const tegucPack: OfflineTilesPackMeta = {
  id: 'tegucigalpa-demo',
  label: 'Tegucigalpa',
  source: 'esri_world_imagery',
  bbox: { west: -87.235, south: 14.03, east: -87.09, north: 14.16 },
  zooms: [14, 15],
  createdAt: 1,
};

describe('manualTraceImagery', () => {
  it('detects coordinates inside a pack bbox', () => {
    expect(bboxContainsCoordinate(tegucPack.bbox, 14.1, -87.15)).toBe(true);
    expect(bboxContainsCoordinate(tegucPack.bbox, 13.9, -87.15)).toBe(false);
  });

  it('prefers the active pack when it covers the coordinate', () => {
    const other: OfflineTilesPackMeta = {
      ...tegucPack,
      id: 'other',
      bbox: { west: -88, south: 13, east: -86, north: 15 },
    };
    const found = findPackCoveringCoordinate([other, tegucPack], 14.1, -87.15, 'tegucigalpa-demo');
    expect(found?.id).toBe('tegucigalpa-demo');
  });

  it('allows online imagery when satellite tiles are reachable', async () => {
    const result = await assessManualTraceImageryAvailability({
      latitude: 14.1,
      longitude: -87.15,
      lowDataMap: false,
      pingOnlineImagery: async () => true,
      listPacks: async () => [],
    });
    expect(result).toEqual({ allowed: true, imagerySource: 'esri_online', packId: null });
  });

  it('blocks low-data blank map mode with GEO-108', async () => {
    const result = await assessManualTraceImageryAvailability({
      latitude: 14.1,
      longitude: -87.15,
      lowDataMap: true,
      pingOnlineImagery: async () => true,
    });
    expect(result).toEqual({ allowed: false, code: 'GEO-108', reason: 'low_data_map' });
  });

  it('falls back to offline pack when offline and a pack covers the plot', async () => {
    const result = await assessManualTraceImageryAvailability({
      latitude: 14.1,
      longitude: -87.15,
      lowDataMap: false,
      pingOnlineImagery: async () => false,
      listPacks: async () => [tegucPack],
    });
    expect(result).toEqual({
      allowed: true,
      imagerySource: 'offline_pack',
      packId: 'tegucigalpa-demo',
    });
  });

  it('returns GEO-108 when offline without covering pack', async () => {
    const result = await assessManualTraceImageryAvailability({
      latitude: -3.4,
      longitude: 29.3,
      lowDataMap: false,
      pingOnlineImagery: async () => false,
      listPacks: async () => [tegucPack],
    });
    expect(result).toEqual({ allowed: false, code: 'GEO-108', reason: 'no_imagery' });
  });

  it('builds a local download bbox around a coordinate', () => {
    const bbox = bboxAroundCoordinate(14.1, -87.2, 0.02);
    expect(bbox.west).toBeCloseTo(-87.22);
    expect(bbox.east).toBeCloseTo(-87.18);
    expect(bboxContainsCoordinate(bbox, 14.1, -87.2)).toBe(true);
  });
});
