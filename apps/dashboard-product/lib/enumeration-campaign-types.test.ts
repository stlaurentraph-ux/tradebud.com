import { describe, expect, it } from 'vitest';
import { parseMappingRegionForm } from '@/lib/enumeration-campaign-types';
import { mappingRegionCenter, mappingRegionToOverlayPolygon } from '@/lib/enumeration-map-region';

describe('enumeration campaign mapping region helpers', () => {
  it('parses valid bbox form values', () => {
    expect(
      parseMappingRegionForm({
        label: 'Copán, Honduras',
        west: '-89.1',
        south: '14.5',
        east: '-88.7',
        north: '15.0',
      }),
    ).toEqual({
      label: 'Copán, Honduras',
      bbox: { west: -89.1, south: 14.5, east: -88.7, north: 15.0 },
    });
  });

  it('builds overlay polygon ring for map preview', () => {
    const region = {
      label: 'Copán, Honduras',
      bbox: { west: -89.1, south: 14.5, east: -88.7, north: 15.0 },
    };
    const overlay = mappingRegionToOverlayPolygon(region);
    expect(overlay.coordinates).toHaveLength(5);
    expect(mappingRegionCenter(region)).toEqual({
      lat: 14.75,
      lng: -88.9,
    });
  });
});
