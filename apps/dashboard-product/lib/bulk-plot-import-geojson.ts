import type { BulkPlotImportInputRow } from '@/lib/bulk-plot-import';

type GeoJsonPosition = [number, number] | [number, number, number];

type GeoJsonGeometry =
  | { type: 'Point'; coordinates: GeoJsonPosition }
  | { type: 'Polygon'; coordinates: GeoJsonPosition[][] };

type GeoJsonFeature = {
  type: 'Feature';
  geometry: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
};

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

const PROPERTY_ALIASES: Record<string, keyof BulkPlotImportInputRow> = {
  producer_full_name: 'producerFullName',
  producerfullname: 'producerFullName',
  producer_name: 'producerFullName',
  full_name: 'producerFullName',
  producer_email: 'producerEmail',
  produceremail: 'producerEmail',
  email: 'producerEmail',
  producer_phone: 'producerPhone',
  producerphone: 'producerPhone',
  phone: 'producerPhone',
  producer_country: 'producerCountry',
  producercountry: 'producerCountry',
  country: 'producerCountry',
  producer_contact_id: 'producerContactId',
  producercontactid: 'producerContactId',
  contact_id: 'producerContactId',
  plot_name: 'plotName',
  plotname: 'plotName',
  name: 'plotName',
  client_plot_id: 'clientPlotId',
  clientplotid: 'clientPlotId',
  plot_id: 'clientPlotId',
  declared_area_ha: 'declaredAreaHa',
  declaredareaha: 'declaredAreaHa',
  area_ha: 'declaredAreaHa',
  cadastral_key: 'cadastralKey',
  cadastralkey: 'cadastralKey',
  clave_catastral: 'cadastralKey',
  country_code: 'countryCode',
  countrycode: 'countryCode',
};

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '_');
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function mapProperties(properties: Record<string, unknown> | null | undefined): Partial<BulkPlotImportInputRow> {
  const mapped: Partial<BulkPlotImportInputRow> = {};
  if (!properties) return mapped;

  for (const [rawKey, value] of Object.entries(properties)) {
    const field = PROPERTY_ALIASES[normalizeKey(rawKey)];
    if (!field || field === 'geometry') continue;
    const text = asString(value);
    if (text == null) continue;
    mapped[field] = text as never;
  }

  return mapped;
}

function toImportGeometry(geometry: GeoJsonGeometry | null): BulkPlotImportInputRow['geometry'] {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    const [longitude, latitude] = geometry.coordinates;
    return { type: 'Point', coordinates: [longitude, latitude] };
  }
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0];
    if (!ring) return null;
    return {
      type: 'Polygon',
      coordinates: [
        ring.map(([longitude, latitude]) => [longitude, latitude] as [number, number]),
      ],
    };
  }
  return null;
}

function parseGeoJsonRoot(text: string): GeoJsonFeatureCollection | GeoJsonFeature {
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('GeoJSON must be a FeatureCollection or Feature.');
  }
  const root = parsed as { type?: string; features?: unknown; geometry?: unknown };
  if (root.type === 'FeatureCollection') {
    if (!Array.isArray(root.features)) {
      throw new Error('FeatureCollection must include a features array.');
    }
    return root as GeoJsonFeatureCollection;
  }
  if (root.type === 'Feature') {
    return root as GeoJsonFeature;
  }
  throw new Error('GeoJSON must be a FeatureCollection or Feature.');
}

export const BULK_PLOT_IMPORT_GEOJSON_SAMPLE = JSON.stringify(
  {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          producer_full_name: 'Maria Lopez',
          producer_email: 'maria@example.com',
          client_plot_id: 'PLOT-001',
          plot_name: 'Finca Norte',
          declared_area_ha: 2.5,
        },
        geometry: {
          type: 'Point',
          coordinates: [-87.8494, 14.6349],
        },
      },
      {
        type: 'Feature',
        properties: {
          producer_full_name: 'Juan Perez',
          client_plot_id: 'PLOT-002',
          declared_area_ha: 8.2,
        },
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
  },
  null,
  2,
);

export function parseAndMapBulkPlotImportGeoJson(text: string): BulkPlotImportInputRow[] {
  const root = parseGeoJsonRoot(text.trim());
  const features = root.type === 'FeatureCollection' ? root.features : [root];

  return features
    .map((feature, index) => {
      const mapped = mapProperties(feature.properties ?? undefined);
      const geometry = toImportGeometry(feature.geometry);
      const clientPlotId = mapped.clientPlotId?.trim() ?? '';

      if (!clientPlotId && !geometry) {
        return null;
      }

      return {
        rowIndex: index + 1,
        clientPlotId,
        ...mapped,
        geometry,
      } as BulkPlotImportInputRow;
    })
    .filter((row): row is BulkPlotImportInputRow => row != null);
}
