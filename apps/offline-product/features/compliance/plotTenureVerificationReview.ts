import type {
  PlotTenureParseStatus,
  PlotTenureVerificationRecord,
} from '@/features/api/postPlot';

export type TenureVerificationReviewDetail = {
  label: string;
  status: PlotTenureParseStatus;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
  /** Raw detail when no i18n interpolation fits (summary, API error). */
  reasonDetail?: string;
};

export function tenureVerificationDocumentLabel(record: PlotTenureVerificationRecord): string {
  const label = record.evidence_label?.trim();
  if (label) return label;
  const leaf = record.storage_path.split('/').pop()?.trim();
  return leaf || record.storage_path;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function describeTenureVerificationReview(
  record: PlotTenureVerificationRecord,
): TenureVerificationReviewDetail {
  const label = tenureVerificationDocumentLabel(record);
  const result = record.parse_result ?? {};

  if (record.parse_status === 'PENDING' || record.parse_status === 'IN_PROGRESS') {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_pending',
    };
  }

  if (record.parse_status === 'COMPLETED') {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_ok',
    };
  }

  if (record.parse_status === 'FAILED') {
    const error = typeof result.error === 'string' ? result.error.trim() : '';
    return {
      label,
      status: record.parse_status,
      reasonKey: error ? 'plot_tenure_doc_reason_failed_detail' : 'plot_tenure_doc_reason_failed',
      reasonDetail: error || undefined,
    };
  }

  const missing = asStringArray(result.clauses_missing);
  if (missing.length > 0) {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_missing_clauses',
      reasonParams: { clauses: missing.slice(0, 3).join(', ') },
    };
  }

  const cross = result.cadastral_cross_check as
    | {
        keys_match?: boolean | null;
        requires_manual_review?: boolean;
        issues?: unknown;
      }
    | undefined;

  if (cross?.keys_match === false) {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_cadastral_mismatch',
    };
  }

  const crossIssues = asStringArray(cross?.issues);
  if (cross?.requires_manual_review) {
    if (crossIssues.length > 0) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_cadastral_issues',
        reasonParams: { issues: crossIssues.slice(0, 3).join(', ') },
      };
    }
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_cadastral_review',
    };
  }

  const summary = typeof result.summary === 'string' ? result.summary.trim() : '';
  if (summary) {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_summary',
      reasonDetail: summary,
    };
  }

  if (
    record.parse_confidence != null &&
    record.parse_confidence < 0.6 &&
    result.parser !== 'manual_required_stub'
  ) {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_low_confidence',
      reasonParams: { percent: Math.round(record.parse_confidence * 100) },
    };
  }

  if (result.parser === 'manual_required_stub') {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_unreadable',
    };
  }

  return {
    label,
    status: record.parse_status,
    reasonKey: 'plot_tenure_manual_review_body',
  };
}

export function formatTenureVerificationReviewMessage(
  detail: TenureVerificationReviewDetail,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (detail.reasonKey === 'plot_tenure_doc_reason_failed_detail' && detail.reasonDetail) {
    return t('plot_tenure_doc_reason_failed_detail', { error: detail.reasonDetail });
  }
  if (detail.reasonKey === 'plot_tenure_doc_reason_summary' && detail.reasonDetail) {
    return detail.reasonDetail;
  }
  return t(detail.reasonKey, detail.reasonParams);
}
