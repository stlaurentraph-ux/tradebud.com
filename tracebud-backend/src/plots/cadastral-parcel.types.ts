import type { GeoJSONPolygon } from './cadastral-parcel-fixtures';

export type CadastralParcelLookupFound = {
  found: true;
  source: 'fixture' | 'registry';
  countryCode: string;
  cadastralKey: string;
  normalizedCadastralKey: string;
  label: string;
  areaHa: number;
  geometry: GeoJSONPolygon;
  registryAttribution: string;
};

export type CadastralParcelLookupResponse =
  | CadastralParcelLookupFound
  | {
      found: false;
      code: string;
      message: string;
    };
