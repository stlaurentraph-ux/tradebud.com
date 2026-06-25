import {
  BULK_PLOT_IMPORT_TEMPLATE_CSV,
  mapBulkPlotImportCsvRows,
  parseBulkPlotImportCsv,
} from '@/lib/bulk-plot-import-csv';

describe('bulk plot import csv', () => {
  it('parses template rows with required client plot id', () => {
    const rows = mapBulkPlotImportCsvRows(parseBulkPlotImportCsv(BULK_PLOT_IMPORT_TEMPLATE_CSV));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.clientPlotId).toBe('PLOT-001');
    expect(rows[0]?.producerFullName).toBe('Maria Lopez');
    expect(rows[0]?.latitude).toBe('14.634900');
    expect(rows[1]?.cadastralKey).toBe('012-345-678-9');
    expect(rows[1]?.countryCode).toBe('HN');
  });
});
