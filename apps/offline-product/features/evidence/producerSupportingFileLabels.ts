import type { PlotEvidenceItem, PlotEvidenceKind } from '@/features/state/persistence';

export const PRODUCER_ADDITIONAL_FILE_LABEL = 'additional_file';
export const PRODUCER_LABOR_FILE_LABEL = 'labor_standards';
export const PRODUCER_COMMUNITY_FILE_LABEL = 'community_letter';

const LEGACY_LABOR_LABELS = new Set(['labor_photo', PRODUCER_LABOR_FILE_LABEL]);

export function isProducerAdditionalFile(item: Pick<PlotEvidenceItem, 'kind' | 'label'>): boolean {
  const label = (item.label ?? '').toLowerCase();
  return item.kind === 'labor_evidence' && (label === PRODUCER_ADDITIONAL_FILE_LABEL || label.startsWith('additional'));
}

export function badgeKeyForProducerSupportingFile(item: Pick<PlotEvidenceItem, 'kind' | 'label'>): string {
  if (isProducerAdditionalFile(item)) return 'documents_badge_additional';
  if (item.kind === 'labor_evidence') return 'documents_badge_labor';
  return 'documents_badge_community';
}

export function fallbackKeyForProducerSupportingFile(item: Pick<PlotEvidenceItem, 'kind' | 'label'>): string {
  if (isProducerAdditionalFile(item)) return 'documents_additional_fallback';
  if (item.kind === 'labor_evidence') return 'documents_labor_fallback';
  return 'documents_fpic_fallback';
}

export function displayLabelForProducerSupportingFile(
  item: PlotEvidenceItem,
  t: (key: string) => string,
): string {
  if (item.label === PRODUCER_ADDITIONAL_FILE_LABEL) {
    return t('documents_add_supporting_additional');
  }
  if (item.label === PRODUCER_COMMUNITY_FILE_LABEL) {
    return t('documents_add_supporting_community');
  }
  if (item.label && LEGACY_LABOR_LABELS.has(item.label)) {
    return t('documents_add_supporting_labor');
  }
  if (item.label) {
    return item.label;
  }
  return t(fallbackKeyForProducerSupportingFile(item));
}

/** Short row title under a category header (file name or date). */
export function supportingFileRowLabel(item: PlotEvidenceItem): string {
  const uri = item.uri?.trim() ?? '';
  if (uri && !uri.startsWith('text:')) {
    const segment = uri.split('/').pop()?.split('?')[0]?.trim();
    if (segment) {
      try {
        const decoded = decodeURIComponent(segment);
        if (decoded.length > 0) return decoded;
      } catch {
        if (segment.length > 0) return segment;
      }
    }
  }
  return new Date(item.takenAt).toLocaleDateString();
}
