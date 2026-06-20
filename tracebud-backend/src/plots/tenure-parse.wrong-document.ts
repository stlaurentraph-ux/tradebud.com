import type { TenureParseResultV1 } from './tenure-parse.types';

export function parseResultHasWrongDocumentClause(
  parseResult: TenureParseResultV1 | Record<string, unknown> | null | undefined,
): boolean {
  if (!parseResult || typeof parseResult !== 'object') return false;
  const clauses = (parseResult as TenureParseResultV1).clauses_missing;
  if (!Array.isArray(clauses)) return false;
  return clauses.some((clause) => String(clause).trim().toLowerCase() === 'not_a_land_document');
}

/** Farmer can fix locally — do not open exporter compliance queue or staff alerts. */
export function isFarmerWrongDocumentOutcome(
  parseStatus: string,
  parseResult: TenureParseResultV1 | Record<string, unknown> | null | undefined,
): boolean {
  return parseStatus === 'FAILED' && parseResultHasWrongDocumentClause(parseResult);
}
