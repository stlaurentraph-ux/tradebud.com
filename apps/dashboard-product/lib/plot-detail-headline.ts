import type { PlotEudrReadinessAssessment } from '@/lib/plot-eudr-readiness';
import { formatDeforestationScreeningStatus } from '@/lib/plot-eudr-readiness';
import type { PlotTenureStatusBadge } from '@/lib/plot-tenure-status';
import { tenureBadgeLabel } from '@/lib/plot-tenure-status';

export type PlotDetailHeadlineTone = 'ready' | 'attention' | 'blocked';

export interface PlotDetailHeadline {
  headline: string;
  supportLine: string;
  tone: PlotDetailHeadlineTone;
}

function tenureShortLabel(badge: PlotTenureStatusBadge): string {
  switch (badge) {
    case 'formal_documented':
    case 'producer_in_possession':
      return 'Tenure documented';
    case 'attestation_only':
      return 'Tenure: attestation only';
    default:
      return 'Tenure: needs document';
  }
}

export function buildPlotDetailHeadline(input: {
  assessment: PlotEudrReadinessAssessment | null;
  screeningStatus: string | null | undefined;
  tenureBadge: PlotTenureStatusBadge;
}): PlotDetailHeadline {
  const screening = input.screeningStatus
    ? formatDeforestationScreeningStatus(input.screeningStatus)
    : 'Screening unknown';
  const tenure = tenureShortLabel(input.tenureBadge);
  const supportLine = `Deforestation screening: ${screening} · ${tenure}`;

  if (!input.assessment) {
    return {
      headline: 'Loading plot readiness…',
      supportLine,
      tone: 'attention',
    };
  }

  if (input.assessment.ready) {
    return {
      headline: 'Ready for EUDR dossier',
      supportLine,
      tone: 'ready',
    };
  }

  const blocking = input.assessment.gaps.filter((gap) => gap.severity === 'blocking').length;
  const total = input.assessment.gaps.length;

  if (blocking > 0) {
    return {
      headline: blocking === 1 ? '1 blocker before shipment use' : `${blocking} blockers before shipment use`,
      supportLine,
      tone: 'blocked',
    };
  }

  if (total === 1) {
    return {
      headline: '1 item to fix',
      supportLine,
      tone: 'attention',
    };
  }

  return {
    headline: `${total} items to fix`,
    supportLine,
    tone: 'attention',
  };
}
