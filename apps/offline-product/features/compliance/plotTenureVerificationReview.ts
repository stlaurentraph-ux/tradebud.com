import type {
  PlotTenureParseStatus,
  PlotTenureVerificationRecord,
} from '@/features/api/postPlot';
import type { TranslateFn } from '@/features/i18n/translate';
import { classifyTenureParseError } from '@/features/compliance/tenureParseFailure';

const DOCUMENT_LABEL_KEYS: Record<string, string> = {
  land_title: 'plot_tenure_doc_label_land_title',
  land_title_photo: 'plot_tenure_doc_label_land_title',
  tenure_evidence: 'plot_tenure_doc_label_tenure_file',
};

function normalizeDocumentToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(jpe?g|png|pdf|heic|webp)$/i, '');
}

function isDevFacingDocumentToken(value: string): boolean {
  const token = normalizeDocumentToken(value);
  if (!token) return true;
  if (/^[a-f0-9-]{20,}$/i.test(token)) return true;
  return /^[a-z0-9_]+$/.test(token);
}

export function tenureVerificationDocumentLabel(record: PlotTenureVerificationRecord): string {
  const label = record.evidence_label?.trim();
  if (label) return label;
  const path = record.storage_path?.trim() ?? '';
  if (!path) return 'Land document';
  const leaf = path.split('/').pop()?.trim();
  return leaf || path;
}

export function formatTenureVerificationDocumentLabel(
  record: PlotTenureVerificationRecord,
  t: TranslateFn,
): string {
  const docSource = record.parse_result?.document_source;
  if (typeof docSource === 'string') {
    const key = DOCUMENT_LABEL_KEYS[normalizeDocumentToken(docSource)];
    if (key) return t(key);
  }

  const evidenceLabel = record.evidence_label?.trim();
  if (evidenceLabel) {
    const key = DOCUMENT_LABEL_KEYS[normalizeDocumentToken(evidenceLabel)];
    if (key) return t(key);
    if (!isDevFacingDocumentToken(evidenceLabel)) return evidenceLabel;
  }

  const raw = tenureVerificationDocumentLabel(record);
  const key = DOCUMENT_LABEL_KEYS[normalizeDocumentToken(raw)];
  if (key) return t(key);
  if (isDevFacingDocumentToken(raw)) return t('plot_tenure_doc_label_land_document');
  return raw;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

const WRONG_DOCUMENT_CLAUSE_KEYS = new Set([
  'not_a_land_document',
  'wrong_document_type',
  'not_land_document',
]);

function parseResultObject(record: PlotTenureVerificationRecord): Record<string, unknown> {
  return record.parse_result && typeof record.parse_result === 'object'
    ? (record.parse_result as Record<string, unknown>)
    : {};
}

function hasMeaningfulLandFields(result: Record<string, unknown>): boolean {
  return ['holder_name', 'parcel_reference', 'title_number', 'community_or_issuer'].some(
    (key) => typeof result[key] === 'string' && result[key].trim().length > 0,
  );
}

function confidenceBreakdown(result: Record<string, unknown>): {
  ocr: number | null;
  fields: number | null;
} {
  const breakdown = result.confidence_breakdown;
  if (!breakdown || typeof breakdown !== 'object') {
    return { ocr: null, fields: null };
  }
  const row = breakdown as { ocr_quality?: unknown; field_completeness?: unknown };
  const ocr = typeof row.ocr_quality === 'number' ? row.ocr_quality : null;
  const fields = typeof row.field_completeness === 'number' ? row.field_completeness : null;
  return { ocr, fields };
}

function summarySuggestsWrongDocument(summary: string): boolean {
  const text = summary.trim().toLowerCase();
  if (!text) return false;
  if (/not (a |an )?(land|title|deed|lease|tenure)\b/.test(text)) return true;
  if (/\bunrelated\b/.test(text)) return true;
  if (/\bwrong (type|document|file|photo)\b/.test(text)) return true;
  if (/\bdoes not (appear|look|seem)\b/.test(text) && /\b(land|title|deed|document|paper)\b/.test(text)) {
    return true;
  }
  return false;
}

function errorSuggestsWrongDocument(error: string): boolean {
  const text = error.trim().toLowerCase();
  if (!text) return false;
  return (
    /not (a |an )?(land|title|deed|lease)\b/.test(text) ||
    /\bwrong document\b/.test(text) ||
    /\bunrelated\b/.test(text)
  );
}

function isWrongDocumentTenureResult(
  result: Record<string, unknown>,
  options?: { error?: string },
): boolean {
  const missing = asStringArray(result.clauses_missing);
  if (missing.some((clause) => WRONG_DOCUMENT_CLAUSE_KEYS.has(clause.trim().toLowerCase()))) {
    return true;
  }

  const summary = typeof result.summary === 'string' ? result.summary : '';
  if (summarySuggestsWrongDocument(summary)) return true;

  if (options?.error && errorSuggestsWrongDocument(options.error)) return true;

  if (result.tenure_type !== 'UNKNOWN') return false;
  if (hasMeaningfulLandFields(result)) return false;

  const { ocr, fields } = confidenceBreakdown(result);
  if (ocr != null && fields != null && ocr >= 0.55 && fields <= 0.3) {
    return true;
  }

  return false;
}

function isUnreadableTenureResult(result: Record<string, unknown>, error?: string): boolean {
  if (hasMeaningfulLandFields(result)) return false;
  if (result.tenure_type && result.tenure_type !== 'UNKNOWN') return false;

  if (error) {
    const kind = classifyTenureParseError(error);
    if (kind === 'wrong_document') return false;
    if (kind === 'service') return false;
    return kind === 'photo';
  }

  const { ocr } = confidenceBreakdown(result);
  return ocr != null && ocr < 0.4;
}

export type TenureVerificationReviewDetail = {
  label: string;
  status: PlotTenureParseStatus;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
  /** Raw detail when no i18n interpolation fits (summary, API error). */
  reasonDetail?: string;
};

export function describeTenureVerificationReview(
  record: PlotTenureVerificationRecord,
  t?: TranslateFn,
): TenureVerificationReviewDetail {
  const label = t ? formatTenureVerificationDocumentLabel(record, t) : tenureVerificationDocumentLabel(record);
  const result = parseResultObject(record);

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
    if (isWrongDocumentTenureResult(result, { error })) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_unreadable',
      };
    }
    if (error && classifyTenureParseError(error) === 'service') {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_check_delayed',
      };
    }
    return {
      label,
      status: record.parse_status,
      reasonKey: error ? 'plot_tenure_doc_reason_failed_detail' : 'plot_tenure_doc_reason_failed',
      reasonDetail: error || undefined,
    };
  }

  if (record.parse_status === 'MANUAL_REQUIRED') {
    const error = typeof result.error === 'string' ? result.error.trim() : '';
    if (isWrongDocumentTenureResult(result, { error })) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_unreadable',
      };
    }
    if (error && classifyTenureParseError(error) === 'service') {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_check_delayed',
      };
    }
  }

  if (result.parser === 'manual_required_stub') {
    const missing = asStringArray(result.clauses_missing);
    if (missing.includes('automated_extraction_unavailable')) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_manual_queue',
        reasonDetail: typeof result.summary === 'string' ? result.summary : undefined,
      };
    }
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_unreadable',
    };
  }

  if (isWrongDocumentTenureResult(result)) {
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_unreadable',
    };
  }

  const missing = asStringArray(result.clauses_missing).filter(
    (clause) =>
      !WRONG_DOCUMENT_CLAUSE_KEYS.has(clause.trim().toLowerCase()) &&
      clause.trim().toLowerCase() !== 'automated_extraction_unavailable',
  );
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
    if (summarySuggestsWrongDocument(summary)) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_unreadable',
      };
    }
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
    if (hasMeaningfulLandFields(result) || (result.tenure_type && result.tenure_type !== 'UNKNOWN')) {
      const landMissing = asStringArray(result.clauses_missing).filter(
        (clause) => !WRONG_DOCUMENT_CLAUSE_KEYS.has(clause.trim().toLowerCase()),
      );
      if (landMissing.length > 0) {
        return {
          label,
          status: record.parse_status,
          reasonKey: 'plot_tenure_doc_reason_missing_clauses',
          reasonParams: { clauses: landMissing.slice(0, 3).join(', ') },
        };
      }
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_manual_review_body',
      };
    }
    if (isUnreadableTenureResult(result)) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_low_confidence',
        reasonParams: { percent: Math.round(record.parse_confidence * 100) },
      };
    }
    if (isWrongDocumentTenureResult(result)) {
      return {
        label,
        status: record.parse_status,
        reasonKey: 'plot_tenure_doc_reason_unreadable',
      };
    }
    return {
      label,
      status: record.parse_status,
      reasonKey: 'plot_tenure_doc_reason_low_confidence',
      reasonParams: { percent: Math.round(record.parse_confidence * 100) },
    };
  }

  return {
    label,
    status: record.parse_status,
    reasonKey: 'plot_tenure_manual_review_body',
  };
}

const REUPLOAD_REASON_KEYS = new Set([
  'plot_tenure_doc_reason_failed',
  'plot_tenure_doc_reason_failed_detail',
  'plot_tenure_doc_reason_unreadable',
  'plot_tenure_doc_reason_low_confidence',
]);

/** Farmer must replace or retake the file — not waiting on cooperative review. */
export function tenureVerificationRequiresReupload(
  record: PlotTenureVerificationRecord,
): boolean {
  if (record.parse_status === 'FAILED') {
    const result = parseResultObject(record);
    const error = typeof result.error === 'string' ? result.error.trim() : '';
    if (error && classifyTenureParseError(error) === 'service') return false;
    return true;
  }
  if (record.parse_status !== 'MANUAL_REQUIRED') return false;
  const detail = describeTenureVerificationReview(record);
  return REUPLOAD_REASON_KEYS.has(detail.reasonKey);
}

export function summarizeTenureBlockedBadge(
  records: PlotTenureVerificationRecord[],
): 'reupload' | 'review' {
  const blocked = records.filter(
    (row) => row.parse_status === 'FAILED' || row.parse_status === 'MANUAL_REQUIRED',
  );
  if (blocked.some(tenureVerificationRequiresReupload)) return 'reupload';
  return 'review';
}

/** Short checklist hint — never repeat per-file detail shown in Land paper check. */
export function resolvePlotLandBlockedShortHint(
  blocked: PlotTenureVerificationRecord | undefined,
  t: TranslateFn,
): string {
  if (!blocked) return t('plot_status_land_parse_blocked');
  if (tenureVerificationRequiresReupload(blocked)) {
    const detail = describeTenureVerificationReview(blocked, t);
    if (detail.reasonKey === 'plot_tenure_doc_reason_unreadable') {
      return t('plot_status_land_wrong_document_hint');
    }
    if (
      detail.reasonKey === 'plot_tenure_doc_reason_check_delayed' ||
      detail.reasonKey === 'plot_tenure_doc_reason_manual_queue'
    ) {
      return t('plot_status_land_check_delayed_hint');
    }
    return t('plot_status_land_reupload_hint');
  }
  return t('plot_status_land_review_hint');
}

/** True when the server saved the file but automated review is still pending or queued. */
export function isTenureVerificationAwaitingReview(
  record: PlotTenureVerificationRecord,
): boolean {
  const detail = describeTenureVerificationReview(record);
  return (
    record.parse_status === 'PENDING' ||
    record.parse_status === 'IN_PROGRESS' ||
    detail.reasonKey === 'plot_tenure_doc_reason_check_delayed' ||
    detail.reasonKey === 'plot_tenure_doc_reason_manual_queue'
  );
}

const PILL_ONLY_REASON_KEYS = new Set([
  'plot_tenure_doc_reason_pending',
  'plot_tenure_doc_reason_ok',
]);

export function shouldShowTenureDocStatusBadge(record: PlotTenureVerificationRecord): boolean {
  if (tenureVerificationRequiresReupload(record)) return false;
  return true;
}

export function shouldShowTenureDocReasonBox(
  record: PlotTenureVerificationRecord,
  detail: TenureVerificationReviewDetail,
  reason: string,
  seenReasons: ReadonlySet<string>,
): boolean {
  if (record.parse_status === 'COMPLETED') {
    return Boolean(detail.reasonDetail);
  }
  if (PILL_ONLY_REASON_KEYS.has(detail.reasonKey)) return false;
  if (seenReasons.has(reason)) return false;
  return true;
}

const KNOWN_CLAUSE_KEYS = new Set([
  'occupation_rights',
  'community_consent',
  'witness_signatures',
  'community_stamp',
  'issuer_stamp',
  'automated_extraction_unavailable',
]);

const CADASTRAL_ISSUE_KEYS: Record<string, string> = {
  cadastral_key_mismatch: 'plot_tenure_issue_cadastral_mismatch',
  holder_name_mismatch: 'plot_tenure_issue_holder_mismatch',
  informal_tenure_formal_document_conflict: 'plot_tenure_issue_tenure_conflict',
  declared_cadastral_key_missing: 'plot_tenure_issue_cadastral_missing',
};

const DEV_FACING_TEXT =
  /(?:^|[\s/])(?:ocr|parser|json|http|tenant\/|manual_required|confidence|parse_status|clauses?_)/i;

function isDevFacingText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (DEV_FACING_TEXT.test(trimmed)) return true;
  if (/^[a-z0-9_]+$/.test(trimmed) && trimmed.includes('_')) return true;
  return false;
}

function humanizeClauseLabel(
  clauseKey: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string | null {
  const key = clauseKey.trim().toLowerCase();
  if (!key || key === 'automated_extraction_unavailable') return null;
  if (KNOWN_CLAUSE_KEYS.has(key)) {
    const label = t(`plot_tenure_clause_${key}`);
    if (label !== `plot_tenure_clause_${key}`) return label;
  }
  if (/^[a-z0-9_]+$/.test(key)) return null;
  return isDevFacingText(key) ? null : key;
}

function humanizeMissingClauses(
  clauses: string[],
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const labels = clauses
    .map((clause) => humanizeClauseLabel(clause, t))
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);
  if (labels.length === 0) return t('plot_tenure_doc_reason_missing_clauses_generic');
  if (labels.length === 1) return t('plot_tenure_doc_reason_missing_one', { item: labels[0] });
  return t('plot_tenure_doc_reason_missing_two', { item1: labels[0], item2: labels[1] });
}

function humanizeCadastralIssues(
  issues: string[],
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  for (const issue of issues) {
    const messageKey = CADASTRAL_ISSUE_KEYS[issue.trim().toLowerCase()];
    if (messageKey) return t(messageKey);
  }
  return t('plot_tenure_doc_reason_cadastral_review');
}

function humanizeParseError(
  detail: TenureVerificationReviewDetail,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (detail.reasonDetail) {
    const kind = classifyTenureParseError(detail.reasonDetail);
    if (kind === 'wrong_document') return t('plot_tenure_doc_reason_unreadable');
    if (kind === 'service') return t('plot_tenure_doc_reason_check_delayed');
  }
  return t('plot_tenure_doc_reason_failed');
}

function humanizeReviewSummary(
  summary: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const trimmed = summary.trim();
  if (!isDevFacingText(trimmed)) return trimmed;
  return t('plot_tenure_manual_review_body');
}

export function formatTenureVerificationReviewMessage(
  detail: TenureVerificationReviewDetail,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  switch (detail.reasonKey) {
    case 'plot_tenure_doc_reason_failed_detail':
      return humanizeParseError(detail, t);
    case 'plot_tenure_doc_reason_summary':
      return detail.reasonDetail
        ? humanizeReviewSummary(detail.reasonDetail, t)
        : t('plot_tenure_manual_review_body');
    case 'plot_tenure_doc_reason_missing_clauses': {
      const raw = detail.reasonParams?.clauses;
      const clauses =
        typeof raw === 'string'
          ? raw.split(',').map((part) => part.trim()).filter(Boolean)
          : [];
      return humanizeMissingClauses(clauses, t);
    }
    case 'plot_tenure_doc_reason_cadastral_issues': {
      const raw = detail.reasonParams?.issues;
      const issues =
        typeof raw === 'string'
          ? raw.split(',').map((part) => part.trim()).filter(Boolean)
          : [];
      return humanizeCadastralIssues(issues, t);
    }
    case 'plot_tenure_doc_reason_low_confidence':
      return t('plot_tenure_doc_reason_unclear_photo');
    case 'plot_tenure_doc_reason_check_delayed':
      return t('plot_tenure_doc_reason_check_delayed');
    case 'plot_tenure_doc_reason_manual_queue':
      return t('plot_tenure_doc_reason_manual_queue');
    default:
      return t(detail.reasonKey, detail.reasonParams);
  }
}
