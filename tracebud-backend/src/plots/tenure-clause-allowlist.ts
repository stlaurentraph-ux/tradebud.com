import type { TenureParseResultV1 } from './tenure-parse.types';

/** Plot geometry is verified on the field map — not from tenure paper OCR. */
const GEOMETRY_CLAUSE_PATTERN =
  /\b(gps|geolocation|geo_location|coordinates?|latitude|longitude|lat_?lon|boundary|boundaries|perimeter|polygon|map_?plot|plot_?map|wgs84|utm)\b/i;

export function isTenureGeometryClause(clause: string): boolean {
  const normalized = clause.trim().replace(/_/g, ' ');
  return GEOMETRY_CLAUSE_PATTERN.test(normalized);
}

export function sanitizeTenureParseClauses(result: TenureParseResultV1): TenureParseResultV1 {
  const clauses_missing = result.clauses_missing.filter((clause) => !isTenureGeometryClause(clause));
  const clauses_found = result.clauses_found.filter((clause) => !isTenureGeometryClause(clause));
  return { ...result, clauses_missing, clauses_found };
}
