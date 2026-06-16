import type { ShipmentStatus, TenantRole } from '@/types';
import {
  getCooperativeNorthStarLabels,
  getExporterNorthStarLabels,
  getImporterNorthStarLabels,
  getReviewerNorthStarLabels,
  getSponsorNorthStarLabels,
} from '@/lib/terminology-labels';

export type NorthStarTone = 'emerald' | 'blue' | 'teal' | 'purple' | 'cyan';

export interface NorthStarConfig {
  label: string;
  value: string;
  hint: string;
  ctaLabel: string;
  ctaHref: string;
  tone: NorthStarTone;
}

export interface NorthStarMetrics {
  packages_by_status?: Partial<Record<ShipmentStatus, number>>;
  total_packages?: number;
  total_plots?: number;
  compliant_plots?: number;
  total_farmers?: number;
  blocking_issues_count?: number;
  members_missing_consent?: number;
  incoming_requests_pending?: number;
  transparencyIndex?: number | null;
  atRiskOrganisations?: number;
}

type TranslateFn = (key: string) => string;

export function getNorthStarForRole(
  role: TenantRole,
  metrics: NorthStarMetrics,
  t?: TranslateFn,
): NorthStarConfig | null {
  const status = metrics.packages_by_status ?? {};

  switch (role) {
    case 'exporter': {
      const readyToSeal = status.READY ?? 0;
      const sealed = status.SEALED ?? 0;
      const value = readyToSeal > 0 ? String(readyToSeal) : String(sealed);
      const labels =
        readyToSeal > 0
          ? getExporterNorthStarLabels('seal', sealed, t)
          : getExporterNorthStarLabels('handoff', sealed, t);
      return {
        ...labels,
        value,
        ctaHref: readyToSeal > 0 ? '/packages?status=READY' : '/packages?status=SEALED',
        tone: 'emerald',
      };
    }
    case 'importer': {
      const pendingReview = (status.READY ?? 0) + (status.ON_HOLD ?? 0);
      const readyToFile = (status.SEALED ?? 0) + (status.READY ?? 0);
      if (pendingReview > 0) {
        const labels = getImporterNorthStarLabels('review', t);
        return {
          ...labels,
          value: String(pendingReview),
          ctaHref: '/compliance',
          tone: 'blue',
        };
      }
      const labels = getImporterNorthStarLabels('filing', t);
      return {
        ...labels,
        value: String(readyToFile),
        ctaHref: '/compliance',
        tone: 'blue',
      };
    }
    case 'cooperative': {
      const pendingPlots = Math.max(0, (metrics.total_plots ?? 0) - (metrics.compliant_plots ?? 0));
      const consentGaps = metrics.members_missing_consent ?? 0;
      const incoming = metrics.incoming_requests_pending ?? 0;
      const attentionCount = pendingPlots + consentGaps + incoming;
      const labels = getCooperativeNorthStarLabels(consentGaps, pendingPlots, incoming, t);
      return {
        ...labels,
        value: String(attentionCount),
        ctaHref: incoming > 0 ? '/inbox' : '/contacts',
        tone: 'teal',
      };
    }
    case 'country_reviewer': {
      const pendingReview = status.READY ?? 0;
      const flagged = metrics.blocking_issues_count ?? 0;
      const labels = getReviewerNorthStarLabels(flagged, t);
      return {
        ...labels,
        value: String(pendingReview),
        ctaHref: '/compliance/queue',
        tone: 'purple',
      };
    }
    case 'sponsor': {
      const index = metrics.transparencyIndex;
      const atRisk = metrics.atRiskOrganisations ?? 0;
      const labels = getSponsorNorthStarLabels(atRisk, t);
      return {
        ...labels,
        value: index !== null && index !== undefined ? `${index}%` : '—',
        ctaHref: '/compliance-health',
        tone: 'cyan',
      };
    }
    default:
      return null;
  }
}
