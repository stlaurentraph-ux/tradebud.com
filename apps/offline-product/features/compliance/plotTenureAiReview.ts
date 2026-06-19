import type {
  PlotTenureParseStatus,
  PlotTenureVerificationRecord,
} from '@/features/api/postPlot';
import { tenureVerificationRequiresReupload } from '@/features/compliance/plotTenureVerificationReview';

export function summarizeTenureAiParseStatus(
  records: PlotTenureVerificationRecord[],
): PlotTenureParseStatus | null {
  if (records.length === 0) return null;
  const priority: PlotTenureParseStatus[] = [
    'FAILED',
    'MANUAL_REQUIRED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
  ];
  for (const status of priority) {
    if (records.some((row) => row.parse_status === status)) return status;
  }
  return records[0]?.parse_status ?? null;
}

export function summarizeCadastralCrossCheck(
  records: PlotTenureVerificationRecord[],
): 'verified' | 'mismatch' | 'pending' | null {
  for (const record of records) {
    const cross = record.parse_result?.cadastral_cross_check as
      | { keys_match?: boolean | null; requires_manual_review?: boolean }
      | undefined;
    if (!cross) continue;
    if (cross.keys_match === true) return 'verified';
    if (cross.keys_match === false || cross.requires_manual_review) return 'mismatch';
  }
  return records.length > 0 ? 'pending' : null;
}

export function tenureAiParseLabelKey(status: PlotTenureParseStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'plot_tenure_ai_complete';
    case 'MANUAL_REQUIRED':
      return 'plot_tenure_ai_manual';
    case 'IN_PROGRESS':
      return 'plot_tenure_ai_in_progress';
    case 'FAILED':
      return 'plot_tenure_ai_failed';
    default:
      return 'plot_tenure_ai_pending';
  }
}

/** Compact status chip for per-file rows in land paper check. */
export function tenureDocRowStatusLabelKey(record: PlotTenureVerificationRecord): string {
  if (tenureVerificationRequiresReupload(record)) {
    return 'plot_tenure_doc_status_reupload';
  }
  switch (record.parse_status) {
    case 'COMPLETED':
      return 'plot_tenure_doc_status_ok';
    case 'MANUAL_REQUIRED':
      return 'plot_tenure_doc_status_review';
    case 'IN_PROGRESS':
    case 'PENDING':
      return 'plot_tenure_doc_status_pending';
    case 'FAILED':
      return 'plot_tenure_doc_status_reupload';
    default:
      return 'plot_tenure_doc_status_pending';
  }
}
