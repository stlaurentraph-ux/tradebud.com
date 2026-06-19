import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import type { PlotEvidenceItem, PlotTitlePhoto } from '@/features/state/persistence';

function byNewestFirst<T extends { takenAt?: number; created_at?: string }>(a: T, b: T): number {
  const at = a.takenAt ?? (a.created_at ? new Date(a.created_at).getTime() : 0);
  const bt = b.takenAt ?? (b.created_at ? new Date(b.created_at).getTime() : 0);
  return bt - at;
}

export function isLandTitleTenureVerification(row: PlotTenureVerificationRecord): boolean {
  const path = row.storage_path.toLowerCase();
  const label = (row.evidence_label ?? '').toLowerCase();
  const source = row.parse_result?.document_source;
  if (source === 'land_title') return true;
  if (path.includes('/land_title/') || path.includes('land_title')) return true;
  if (label === 'land_title_photo' || label.includes('land_title')) return true;
  return false;
}

/**
 * Hide server tenure-check rows that no longer match files still on the phone.
 */
export function filterTenureVerificationsForLocalLandDocs(
  records: PlotTenureVerificationRecord[],
  titlePhotos: readonly PlotTitlePhoto[],
  tenureEvidence: readonly PlotEvidenceItem[],
): PlotTenureVerificationRecord[] {
  if (titlePhotos.length === 0 && tenureEvidence.length === 0) {
    return [];
  }

  const landTitleRows = records
    .filter(isLandTitleTenureVerification)
    .sort((a, b) => byNewestFirst(a, b));
  const tenureRows = records
    .filter((row) => !isLandTitleTenureVerification(row))
    .sort((a, b) => byNewestFirst(a, b));

  const keptLandTitle = landTitleRows.slice(0, titlePhotos.length);
  const keptTenure = tenureRows.slice(0, tenureEvidence.length);

  const keptIds = new Set([...keptLandTitle, ...keptTenure].map((row) => row.id));
  return records.filter((row) => keptIds.has(row.id));
}
