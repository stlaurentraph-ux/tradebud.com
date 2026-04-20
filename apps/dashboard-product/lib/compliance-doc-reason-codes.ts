export type EvidenceItem = {
  id: string;
  type: 'satellite_imagery' | 'field_report' | 'government_source' | 'certification';
  title: string;
  status: 'verified' | 'pending' | 'rejected';
  date: string;
  source: string;
};

export type ComplianceDocReasonCode =
  | 'DOC_MISSING'
  | 'DOC_PENDING_REVIEW'
  | 'DOC_REJECTED'
  | 'DOC_STALE'
  | 'DOC_SOURCE_MISSING';

export type ComplianceDocReasonSeverity = 'warning' | 'blocking';

export interface ComplianceDocReason {
  code: ComplianceDocReasonCode;
  severity: ComplianceDocReasonSeverity;
  message: string;
  remediation: string;
}

export interface ComplianceDocEvaluationResult {
  status: 'pass' | 'warning' | 'fail';
  reasons: ComplianceDocReason[];
}

const STALE_DOC_MAX_AGE_DAYS = 365;

function daysBetween(fromIsoDate: string, toDate: Date): number {
  const from = new Date(fromIsoDate);
  if (Number.isNaN(from.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.floor((toDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function evaluateComplianceEvidenceRequirements(
  requiredEvidence: EvidenceItem[],
  missingEvidence: string[],
  now = new Date(),
): ComplianceDocEvaluationResult {
  const reasons: ComplianceDocReason[] = [];

  for (const missingItem of missingEvidence) {
    reasons.push({
      code: 'DOC_MISSING',
      severity: 'blocking',
      message: `${missingItem} is missing.`,
      remediation: `Upload ${missingItem} and submit for verification.`,
    });
  }

  for (const evidence of requiredEvidence) {
    if (evidence.status === 'pending') {
      reasons.push({
        code: 'DOC_PENDING_REVIEW',
        severity: 'warning',
        message: `${evidence.title} is still pending verification.`,
        remediation: 'Complete reviewer validation and re-run preflight checks.',
      });
    }

    if (evidence.status === 'rejected') {
      reasons.push({
        code: 'DOC_REJECTED',
        severity: 'blocking',
        message: `${evidence.title} was rejected during review.`,
        remediation: 'Upload a corrected document and request a new review.',
      });
    }

    if (!evidence.source.trim()) {
      reasons.push({
        code: 'DOC_SOURCE_MISSING',
        severity: 'warning',
        message: `${evidence.title} has no source attribution.`,
        remediation: 'Attach origin/source metadata for audit traceability.',
      });
    }

    if (daysBetween(evidence.date, now) > STALE_DOC_MAX_AGE_DAYS) {
      reasons.push({
        code: 'DOC_STALE',
        severity: 'warning',
        message: `${evidence.title} is older than ${STALE_DOC_MAX_AGE_DAYS} days.`,
        remediation: 'Refresh the document with a current version before submission.',
      });
    }
  }

  if (reasons.some((reason) => reason.severity === 'blocking')) {
    return { status: 'fail', reasons };
  }
  if (reasons.length > 0) {
    return { status: 'warning', reasons };
  }
  return { status: 'pass', reasons: [] };
}
