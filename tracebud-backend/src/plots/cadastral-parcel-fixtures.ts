export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][];
};

export type CadastralParcelFixture = {
  countryIso: string;
  cadastralKey: string;
  label: string;
  areaHa: number;
  geometry: GeoJSONPolygon;
  registryAttribution: string;
};

/** Demo registry parcels for bulk import and field cadastral lookup QA. */
export const CADASTRAL_PARCEL_FIXTURES: CadastralParcelFixture[] = [
  {
    countryIso: 'HN',
    cadastralKey: '012-345-678-9',
    label: 'Demo parcel — Copán corridor',
    areaHa: 1.82,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-88.95, 14.82],
          [-88.9492, 14.82],
          [-88.9492, 14.8192],
          [-88.95, 14.8192],
          [-88.95, 14.82],
        ],
      ],
    },
    registryAttribution: 'Tracebud demo cadastral fixture (HN)',
  },
  {
    countryIso: 'GT',
    cadastralKey: '123-456-7890',
    label: 'Demo parcel — Guatemala matrícula',
    areaHa: 0.38,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-90.515, 14.634],
          [-90.5135, 14.634],
          [-90.5135, 14.6352],
          [-90.515, 14.6352],
          [-90.515, 14.634],
        ],
      ],
    },
    registryAttribution: 'Tracebud demo fixture (GT matrícula)',
  },
];
