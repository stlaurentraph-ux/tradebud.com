import {
  BULK_PLOT_IMPORT_PACKAGE_SAMPLE,
  computeTracebudImportV1ContentHash,
  parseAndVerifyTracebudImportV1Package,
  parseTracebudImportV1Package,
  TRACEBUD_IMPORT_V1_FORMAT,
} from '@/lib/bulk-plot-import-package';

describe('bulk plot import package', () => {
  it('maps tracebud_import_v1 producers and plots to import rows', async () => {
    const result = await parseAndVerifyTracebudImportV1Package(BULK_PLOT_IMPORT_PACKAGE_SAMPLE);
    expect(result.package.format_version).toBe(TRACEBUD_IMPORT_V1_FORMAT);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.clientPlotId).toBe('PLOT-001');
    expect(result.rows[0]?.producerFullName).toBe('Maria Lopez');
    expect(result.rows[1]?.geometry?.type).toBe('Polygon');
    expect(result.evidenceReferenceCount).toBe(1);
  });

  it('rejects packages with the wrong format_version', () => {
    expect(() =>
      parseTracebudImportV1Package(
        JSON.stringify({
          format_version: 'other_v1',
          source_system: 'x',
          exported_at: '2026-01-01T00:00:00.000Z',
          producers: [],
          plots: [],
        }),
      ),
    ).toThrow('format_version');
  });

  it('validates content_hash_sha256 when present', async () => {
    const parsed = parseTracebudImportV1Package(BULK_PLOT_IMPORT_PACKAGE_SAMPLE);
    const withHash = {
      ...parsed.package,
      content_hash_sha256: await computeTracebudImportV1ContentHash(parsed.package),
    };
    await expect(
      parseAndVerifyTracebudImportV1Package(JSON.stringify(withHash)),
    ).resolves.toMatchObject({ rows: expect.any(Array) });

    const tampered = {
      ...withHash,
      source_system: 'tampered',
    };
    await expect(
      parseAndVerifyTracebudImportV1Package(JSON.stringify(tampered)),
    ).rejects.toThrow('content_hash_sha256');
  });

  it('skips plots with unknown producer_ref', () => {
    const result = parseTracebudImportV1Package(
      JSON.stringify({
        format_version: TRACEBUD_IMPORT_V1_FORMAT,
        source_system: 'demo',
        exported_at: '2026-01-01T00:00:00.000Z',
        producers: [],
        plots: [
          {
            client_plot_id: 'PLOT-X',
            producer_ref: 'MISSING',
            country_iso: 'HN',
            geolocation_mode: 'POINT',
            declared_area_ha: 1,
            geometry: { type: 'Point', coordinates: [-87.1, 14.1] },
          },
        ],
      }),
    );
    expect(result.rows).toHaveLength(0);
    expect(result.skippedPlotCount).toBe(1);
    expect(result.skipMessages[0]).toContain('unknown producer_ref');
  });
});
