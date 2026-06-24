import {
  BULK_PLOT_IMPORT_GEOJSON_SAMPLE,
  parseAndMapBulkPlotImportGeoJson,
} from '@/lib/bulk-plot-import-geojson';

describe('bulk plot import geojson', () => {
  it('maps FeatureCollection properties and geometry to import rows', () => {
    const rows = parseAndMapBulkPlotImportGeoJson(BULK_PLOT_IMPORT_GEOJSON_SAMPLE);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.clientPlotId).toBe('PLOT-001');
    expect(rows[0]?.producerFullName).toBe('Maria Lopez');
    expect(rows[0]?.geometry?.type).toBe('Point');
    expect(rows[1]?.geometry?.type).toBe('Polygon');
    expect(rows[1]?.declaredAreaHa).toBe('8.2');
  });

  it('rejects non-FeatureCollection roots', () => {
    expect(() => parseAndMapBulkPlotImportGeoJson('{"type":"Point"}')).toThrow(
      'GeoJSON must be a FeatureCollection or Feature.',
    );
  });
});
