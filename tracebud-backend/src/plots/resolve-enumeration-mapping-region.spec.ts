import { parseMappingRegionRow, bboxContainsRegion } from './resolve-enumeration-mapping-region';

describe('resolve-enumeration-mapping-region', () => {
  it('parses valid mapping region rows', () => {
    expect(
      parseMappingRegionRow({
        mapping_region_label: 'Copán, Honduras',
        mapping_region_west: -89.1,
        mapping_region_south: 14.5,
        mapping_region_east: -88.7,
        mapping_region_north: 15.0,
      }),
    ).toEqual({
      label: 'Copán, Honduras',
      bbox: { west: -89.1, south: 14.5, east: -88.7, north: 15.0 },
    });
  });

  it('rejects incomplete rows', () => {
    expect(parseMappingRegionRow({ mapping_region_label: 'X' })).toBeNull();
  });

  it('checks bbox containment for installed packs', () => {
    const region = {
      west: -89.0,
      south: 14.6,
      east: -88.8,
      north: 14.9,
    };
    expect(
      bboxContainsRegion(
        { west: -89.2, south: 14.4, east: -88.6, north: 15.1 },
        region,
      ),
    ).toBe(true);
    expect(
      bboxContainsRegion(
        { west: -89.0, south: 14.6, east: -88.9, north: 14.7 },
        region,
      ),
    ).toBe(false);
  });
});
