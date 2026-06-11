/** EUDR importer sold-lineage retention window (spec §11.4). */
export const SOLD_LINEAGE_RETENTION_YEARS = 5;

export function soldLineageRetentionUntil(fromIso: string | Date): string {
  const base = fromIso instanceof Date ? fromIso : new Date(fromIso);
  const until = new Date(base);
  until.setUTCFullYear(until.getUTCFullYear() + SOLD_LINEAGE_RETENTION_YEARS);
  return until.toISOString();
}
