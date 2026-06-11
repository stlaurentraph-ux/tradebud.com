import type {
  PlotTenureParseStatus,
  PlotTenureVerificationRecord,
} from '@/features/api/postPlot';

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
