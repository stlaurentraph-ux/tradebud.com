import type { CadastralParcelLookupResult } from './cadastral-parcel.types';

export const CADASTRAL_PARCEL_FIXTURES: Readonly<Record<string, CadastralParcelLookupResult>> = {
  'HN:012-345-678-9': {
    countryIso: 'HN',
    cadastralKey: '012-345-678-9',
    label: 'Demo parcel — Tegucigalpa sector',
    areaHa: 0.42,
    geometry: {"type": "Polygon", "coordinates": [[[-87.1928, 14.0723], [-87.191, 14.0723], [-87.191, 14.0735], [-87.1928, 14.0735], [-87.1928, 14.0723]]]} as CadastralParcelLookupResult['geometry'],
    registryAttribution: 'Tracebud demo fixture (HN clave catastral)',
  },
  'GT:123-456-7890': {
    countryIso: 'GT',
    cadastralKey: '123-456-7890',
    label: 'Demo parcel — Guatemala matrícula',
    areaHa: 0.38,
    geometry: {"type": "Polygon", "coordinates": [[[-90.515, 14.634], [-90.5135, 14.634], [-90.5135, 14.6352], [-90.515, 14.6352], [-90.515, 14.634]]]} as CadastralParcelLookupResult['geometry'],
    registryAttribution: 'Tracebud demo fixture (GT matrícula)',
  },
};

export function cadastralFixtureKey(countryIso: string, normalizedKey: string): string {
  return `${countryIso.toUpperCase()}:${normalizedKey}`;
}
