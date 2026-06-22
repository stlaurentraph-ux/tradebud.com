/** ISO calendar date (YYYY-MM-DD) for Tracebud harvest_date fields. */
export function harvestDateIsoFromMs(ms: number): string {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/** Parse `harvest-{plotId}-{recordedAtMs}` client event ids from the field app. */
export function parseRecordedAtFromClientEventId(clientEventId: string): number | null {
  const trimmed = clientEventId.trim();
  if (!trimmed.startsWith('harvest-')) return null;
  const lastDash = trimmed.lastIndexOf('-');
  if (lastDash <= 'harvest-'.length) return null;
  const suffix = trimmed.slice(lastDash + 1);
  if (!/^\d{10,16}$/.test(suffix)) return null;
  const ms = Number(suffix);
  return Number.isFinite(ms) ? ms : null;
}
