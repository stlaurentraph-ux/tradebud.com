import { describe, expect, it } from 'vitest';

import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { describeTenureVerificationReview } from './plotTenureVerificationReview';

function baseRecord(
  overrides: Partial<PlotTenureVerificationRecord>,
): PlotTenureVerificationRecord {
  return {
    id: 'v1',
    plot_id: 'p1',
    storage_path: 'tenant/farmer/p1/tenure_evidence/letter.jpg',
    mime_type: 'image/jpeg',
    evidence_label: 'Municipal letter',
    parse_status: 'MANUAL_REQUIRED',
    parse_result: null,
    parse_confidence: 0.45,
    parse_reviewed_by: null,
    parse_reviewed_at: null,
    created_at: '2026-06-11T00:00:00.000Z',
    updated_at: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}

describe('describeTenureVerificationReview', () => {
  it('surfaces missing clauses for manual review', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: { clauses_missing: ['witness_signatures', 'issuer_stamp'] },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_missing_clauses');
    expect(detail.reasonParams?.clauses).toContain('witness_signatures');
  });

  it('surfaces cadastral mismatch', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: {
          cadastral_cross_check: { keys_match: false, requires_manual_review: true },
        },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_cadastral_mismatch');
  });

  it('surfaces API error on failed parse', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_status: 'FAILED',
        parse_result: { error: 'OCR could not read document' },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_failed_detail');
    expect(detail.reasonDetail).toBe('OCR could not read document');
  });
});
