import type { DDSPackage, PackageComplianceStatus, ShipmentStatus, TenantRole } from '@/types';
import { getReviewQueueActionLabel } from '@/lib/workflow-labels';

export type ReviewQueueRisk = 'low' | 'medium' | 'high';

export interface ReviewQueueItem {
  id: string;
  code: string;
  supplierName: string;
  status: ShipmentStatus;
  complianceStatus: PackageComplianceStatus;
  riskLevel: ReviewQueueRisk;
  plotsCount: number;
  updatedAt: string;
  actionLabel: string;
  actionHref: string;
}

type ReviewQueueRole = Extract<TenantRole, 'importer' | 'country_reviewer'>;
type TranslateFn = (key: string) => string;

const IMPORTER_QUEUE_STATUSES = new Set<ShipmentStatus>(['READY', 'ON_HOLD', 'SEALED']);
const REVIEWER_QUEUE_STATUSES = new Set<ShipmentStatus>(['READY', 'ON_HOLD', 'SUBMITTED']);

const COMPLIANCE_PRIORITY: Record<PackageComplianceStatus, number> = {
  BLOCKED: 0,
  WARNINGS: 1,
  PENDING: 2,
  PASSED: 3,
};

const STATUS_PRIORITY: Record<ShipmentStatus, number> = {
  ON_HOLD: 0,
  READY: 1,
  DRAFT: 2,
  SEALED: 3,
  SUBMITTED: 4,
  REJECTED: 5,
  ACCEPTED: 6,
  ARCHIVED: 7,
};

const RISK_PRIORITY: Record<ReviewQueueRisk, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function derivePackageRiskLevel(pkg: DDSPackage): ReviewQueueRisk {
  if (pkg.plots.some((plot) => plot.deforestation_risk === 'high')) {
    return 'high';
  }
  if (pkg.plots.some((plot) => plot.deforestation_risk === 'medium')) {
    return 'medium';
  }
  return 'low';
}

export function buildReviewQueueAction(
  role: ReviewQueueRole,
  pkg: DDSPackage,
  t?: TranslateFn,
): { actionLabel: string; actionHref: string } {
  const actionLabel = getReviewQueueActionLabel(role, pkg.status, t);
  if (role === 'importer') {
    return {
      actionLabel,
      actionHref: `/compliance?package=${pkg.id}`,
    };
  }

  return {
    actionLabel,
    actionHref: `/packages/${pkg.id}`,
  };
}

export function isPackageInReviewQueue(pkg: DDSPackage, role: ReviewQueueRole): boolean {
  const allowed = role === 'importer' ? IMPORTER_QUEUE_STATUSES : REVIEWER_QUEUE_STATUSES;
  return allowed.has(pkg.status);
}

export function buildMiniReviewQueue(
  packages: DDSPackage[],
  role: ReviewQueueRole,
  limit = 5,
  t?: TranslateFn,
): ReviewQueueItem[] {
  return packages
    .filter((pkg) => isPackageInReviewQueue(pkg, role))
    .sort((a, b) => {
      const complianceDelta = COMPLIANCE_PRIORITY[a.compliance_status] - COMPLIANCE_PRIORITY[b.compliance_status];
      if (complianceDelta !== 0) return complianceDelta;

      const statusDelta = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (statusDelta !== 0) return statusDelta;

      const riskDelta = RISK_PRIORITY[derivePackageRiskLevel(a)] - RISK_PRIORITY[derivePackageRiskLevel(b)];
      if (riskDelta !== 0) return riskDelta;

      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    })
    .slice(0, limit)
    .map((pkg) => {
      const action = buildReviewQueueAction(role, pkg, t);
      return {
        id: pkg.id,
        code: pkg.code,
        supplierName: pkg.supplier_name,
        status: pkg.status,
        complianceStatus: pkg.compliance_status,
        riskLevel: derivePackageRiskLevel(pkg),
        plotsCount: pkg.plots.length,
        updatedAt: pkg.updated_at,
        actionLabel: action.actionLabel,
        actionHref: action.actionHref,
      };
    });
}

export {
  formatReviewQueuePlotCount,
  formatReviewQueueRelativeAge,
  getMiniReviewQueueCopy,
  getReviewQueueBlockedLabel,
  getReviewQueueLoadErrorPrefix,
  getReviewQueueRiskLabel,
} from '@/lib/workflow-labels';
