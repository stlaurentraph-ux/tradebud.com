/**
 * @vitest-environment jsdom
 */
import {
  BULK_PLOT_IMPORT_KML_SAMPLE,
  kmlTextToGeoJsonText,
  parseAndMapBulkPlotImportKml,
} from '@/lib/bulk-plot-import-kml';

describe('bulk plot import kml', () => {
  it('maps KML placemarks to import rows via GeoJSON conversion', () => {
    const rows = parseAndMapBulkPlotImportKml(BULK_PLOT_IMPORT_KML_SAMPLE);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.clientPlotId).toBe('PLOT-001');
    expect(rows[0]?.producerFullName).toBe('Maria Lopez');
    expect(rows[0]?.geometry?.type).toBe('Point');
    expect(rows[1]?.geometry?.type).toBe('Polygon');
  });

  it('rejects invalid KML', () => {
    expect(() => parseAndMapBulkPlotImportKml('<kml><broken')).toThrow('Invalid KML XML');
  });

  it('converts placemarks to FeatureCollection JSON', () => {
    const geojson = JSON.parse(kmlTextToGeoJsonText(BULK_PLOT_IMPORT_KML_SAMPLE)) as {
      type: string;
      features: unknown[];
    };
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(2);
  });
});
