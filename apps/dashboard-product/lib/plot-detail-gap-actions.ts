import type { PlotEudrReadinessGapId } from '@/lib/plot-eudr-readiness';
import type { PlotDetailSectionId } from '@/lib/plot-detail-section-policy';

export interface PlotReadinessGapAction {
  label: string;
  href?: string;
  section?: PlotDetailSectionId;
}

export function getPlotReadinessGapAction(gapId: PlotEudrReadinessGapId): PlotReadinessGapAction {
  switch (gapId) {
    case 'tenure':
    case 'evidence':
      return { label: 'Open documents', section: 'documents' };
    case 'ground_truth_photos':
      return { label: 'Field capture guide', section: 'field_ops' };
    case 'field_capture':
      return { label: 'Request plot data', href: '/outreach?new=1' };
    case 'deforestation_screening':
      return { label: 'View screening', section: 'screening' };
    default:
      return { label: 'View details', section: 'documents' };
  }
}

export function pickPrimaryPlotGapAction(
  gaps: { id: PlotEudrReadinessGapId; severity: 'blocking' | 'warning' }[],
): PlotReadinessGapAction | null {
  const ordered = [...gaps].sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === 'blocking' ? -1 : 1;
  });
  const first = ordered[0];
  if (!first) return null;
  return getPlotReadinessGapAction(first.id);
}
