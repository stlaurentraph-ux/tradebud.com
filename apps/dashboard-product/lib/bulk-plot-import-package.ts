import type { BulkPlotImportGeoJsonGeometry, BulkPlotImportInputRow } from '@/lib/bulk-plot-import';

async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('SHA-256 is unavailable in this runtime.');
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export const TRACEBUD_IMPORT_V1_FORMAT = 'tracebud_import_v1';

export type TracebudImportV1Producer = {
  producer_ref: string;
  full_name: string;
  country_iso: string;
  email?: string | null;
  phone?: string | null;
  capture_method?: string | null;
};

export type TracebudImportV1Plot = {
  client_plot_id: string;
  producer_ref: string;
  plot_name?: string | null;
  country_iso: string;
  geolocation_mode: 'POINT' | 'POLYGON' | 'POSTAL_ADDRESS';
  declared_area_ha?: number | string | null;
  geometry?: BulkPlotImportGeoJsonGeometry | null;
  cadastral_key?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type TracebudImportV1EvidenceReference = {
  document_ref: string;
  document_type?: string | null;
  file_hash_sha256?: string | null;
};

export type TracebudImportV1Package = {
  format_version: typeof TRACEBUD_IMPORT_V1_FORMAT;
  source_system: string;
  exported_at: string;
  content_hash_sha256?: string;
  signature?: string;
  producers: TracebudImportV1Producer[];
  plots: TracebudImportV1Plot[];
  evidence_references?: TracebudImportV1EvidenceReference[];
};

export type TracebudImportV1ParseResult = {
  package: TracebudImportV1Package;
  rows: BulkPlotImportInputRow[];
  evidenceReferenceCount: number;
  skippedPlotCount: number;
  skipMessages: string[];
};

export const BULK_PLOT_IMPORT_PACKAGE_SAMPLE = JSON.stringify(
  {
    format_version: TRACEBUD_IMPORT_V1_FORMAT,
    source_system: 'legacy_gis_export',
    exported_at: '2026-06-24T10:00:00.000Z',
    producers: [
      {
        producer_ref: 'PROD-001',
        full_name: 'Maria Lopez',
        country_iso: 'HN',
        email: 'maria@example.com',
        capture_method: 'BULK_IMPORT',
      },
      {
        producer_ref: 'PROD-002',
        full_name: 'Juan Perez',
        country_iso: 'HN',
        capture_method: 'BULK_IMPORT',
      },
    ],
    plots: [
      {
        client_plot_id: 'PLOT-001',
        producer_ref: 'PROD-001',
        plot_name: 'Finca Norte',
        country_iso: 'HN',
        geolocation_mode: 'POINT',
        declared_area_ha: 2.5,
        geometry: { type: 'Point', coordinates: [-87.8494, 14.6349] },
      },
      {
        client_plot_id: 'PLOT-002',
        producer_ref: 'PROD-002',
        plot_name: 'Parcela Sur',
        country_iso: 'HN',
        geolocation_mode: 'POLYGON',
        declared_area_ha: 8.2,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-87.1, 14.1],
              [-87.2, 14.1],
              [-87.2, 14.2],
              [-87.1, 14.2],
              [-87.1, 14.1],
            ],
          ],
        },
      },
    ],
    evidence_references: [
      {
        document_ref: 'DOC-001',
        document_type: 'land_title',
        file_hash_sha256: 'abc123',
      },
    ],
  },
  null,
  2,
);

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObjectKeys(entry));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }
  return value;
}

export function canonicalizeTracebudImportV1ForHash(
  pkg: TracebudImportV1Package,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...pkg };
  delete payload.content_hash_sha256;
  delete payload.signature;
  return sortObjectKeys(payload) as Record<string, unknown>;
}

export async function computeTracebudImportV1ContentHash(pkg: TracebudImportV1Package): Promise<string> {
  const canonical = JSON.stringify(canonicalizeTracebudImportV1ForHash(pkg));
  return sha256Hex(canonical);
}

export async function verifyTracebudImportV1ContentHash(pkg: TracebudImportV1Package): Promise<boolean> {
  const expected = pkg.content_hash_sha256?.trim().toLowerCase();
  if (!expected) return true;
  const actual = await computeTracebudImportV1ContentHash(pkg);
  return actual === expected;
}

function assertPackageShape(parsed: unknown): TracebudImportV1Package {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Import package must be a JSON object.');
  }
  const root = parsed as Partial<TracebudImportV1Package>;
  if (root.format_version !== TRACEBUD_IMPORT_V1_FORMAT) {
    throw new Error(`format_version must be "${TRACEBUD_IMPORT_V1_FORMAT}".`);
  }
  if (!root.source_system?.trim()) {
    throw new Error('source_system is required.');
  }
  if (!root.exported_at?.trim()) {
    throw new Error('exported_at is required.');
  }
  if (!Array.isArray(root.producers) || !Array.isArray(root.plots)) {
    throw new Error('producers and plots must be arrays.');
  }
  return root as TracebudImportV1Package;
}

function mapPlotToRow(params: {
  plot: TracebudImportV1Plot;
  producer: TracebudImportV1Producer | undefined;
  rowIndex: number;
}): BulkPlotImportInputRow | null {
  const { plot, producer, rowIndex } = params;
  const clientPlotId = plot.client_plot_id?.trim() ?? '';
  if (!clientPlotId) {
    return null;
  }
  if (!producer) {
    throw new Error(`Plot ${clientPlotId} references unknown producer_ref "${plot.producer_ref}".`);
  }

  const row: BulkPlotImportInputRow = {
    rowIndex,
    clientPlotId,
    producerFullName: producer.full_name?.trim() || undefined,
    producerEmail: producer.email?.trim() || null,
    producerPhone: producer.phone?.trim() || null,
    producerCountry: producer.country_iso?.trim().toUpperCase() || plot.country_iso?.trim().toUpperCase(),
    plotName: plot.plot_name?.trim() || null,
    countryCode: plot.country_iso?.trim().toUpperCase() || null,
    cadastralKey: plot.cadastral_key?.trim() || null,
    declaredAreaHa: plot.declared_area_ha ?? null,
  };

  if (plot.geolocation_mode === 'POSTAL_ADDRESS') {
    throw new Error(
      `Plot ${clientPlotId} uses POSTAL_ADDRESS geolocation_mode, which is not supported in bulk import yet.`,
    );
  }

  if (plot.geometry) {
    row.geometry = plot.geometry;
    return row;
  }

  if (plot.cadastral_key?.trim()) {
    return row;
  }

  if (plot.geolocation_mode === 'POINT' || plot.latitude != null || plot.longitude != null) {
    row.latitude = plot.latitude ?? null;
    row.longitude = plot.longitude ?? null;
    return row;
  }

  throw new Error(
    `Plot ${clientPlotId} must include geometry, cadastral_key, or latitude/longitude coordinates.`,
  );
}

export function mapTracebudImportV1PackageToRows(pkg: TracebudImportV1Package): {
  rows: BulkPlotImportInputRow[];
  skippedPlotCount: number;
  skipMessages: string[];
} {
  const producersByRef = new Map<string, TracebudImportV1Producer>();
  for (const producer of pkg.producers) {
    const ref = producer.producer_ref?.trim();
    if (!ref) continue;
    producersByRef.set(ref, producer);
  }

  const rows: BulkPlotImportInputRow[] = [];
  const skipMessages: string[] = [];
  let skippedPlotCount = 0;

  pkg.plots.forEach((plot, index) => {
    try {
      const producer = producersByRef.get(plot.producer_ref?.trim() ?? '');
      const row = mapPlotToRow({ plot, producer, rowIndex: index + 1 });
      if (!row) {
        skippedPlotCount += 1;
        skipMessages.push(`Plot row ${index + 1} is missing client_plot_id.`);
        return;
      }
      rows.push(row);
    } catch (error) {
      skippedPlotCount += 1;
      skipMessages.push(error instanceof Error ? error.message : `Plot row ${index + 1} failed.`);
    }
  });

  return { rows, skippedPlotCount, skipMessages };
}

export function parseTracebudImportV1Package(text: string): TracebudImportV1ParseResult {
  const parsed = JSON.parse(text) as unknown;
  const pkg = assertPackageShape(parsed);
  const mapped = mapTracebudImportV1PackageToRows(pkg);

  return {
    package: pkg,
    rows: mapped.rows,
    evidenceReferenceCount: pkg.evidence_references?.length ?? 0,
    skippedPlotCount: mapped.skippedPlotCount,
    skipMessages: mapped.skipMessages,
  };
}

export async function parseAndVerifyTracebudImportV1Package(
  text: string,
): Promise<TracebudImportV1ParseResult> {
  const result = parseTracebudImportV1Package(text);
  const hashValid = await verifyTracebudImportV1ContentHash(result.package);
  if (!hashValid) {
    throw new Error('content_hash_sha256 does not match the package payload.');
  }
  if (result.package.signature?.trim()) {
    throw new Error(
      'signature is present but asymmetric signature verification is not enabled in this release. Remove signature or import without it.',
    );
  }
  return result;
}
