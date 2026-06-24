export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

export type CadastralParcelLookupResult = {
  countryIso: string;
  cadastralKey: string;
  label: string;
  areaHa: number;
  geometry: GeoJSONPolygon;
  registryAttribution: string;
};

export type CadastralParcelLookupMiss = {
  code: 'NOT_FOUND' | 'INVALID_KEY' | 'UNSUPPORTED_COUNTRY';
  message: string;
};
