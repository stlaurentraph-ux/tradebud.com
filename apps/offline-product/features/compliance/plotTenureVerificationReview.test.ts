import { describe, expect, it } from 'vitest';

import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import {
  describeTenureVerificationReview,
  formatTenureVerificationReviewMessage,
  summarizeTenureBlockedBadge,
  tenureVerificationRequiresReupload,
  shouldShowTenureDocReasonBox,
  shouldShowTenureDocStatusBadge,
  resolvePlotLandBlockedShortHint,
} from './plotTenureVerificationReview';

const t = (key: string, params?: Record<string, string | number>) => {
  const table: Record<string, string> = {
    plot_tenure_doc_reason_failed: 'Could not read photo',
    plot_tenure_doc_reason_missing_one: 'Needs: {item}',
    plot_tenure_doc_label_land_title: 'Land title photo',
    plot_tenure_clause_witness_signatures: 'Witness signatures',
    plot_tenure_clause_issuer_stamp: 'Official stamp',
    plot_tenure_doc_reason_missing_clauses_generic: 'Something is missing',
    plot_tenure_doc_reason_unclear_photo: 'Unclear photo',
    plot_tenure_doc_reason_unreadable: 'Not a land paper',
    plot_tenure_manual_review_body: 'Cooperative will check',
    plot_tenure_issue_cadastral_mismatch: 'Registry mismatch',
    plot_tenure_doc_reason_cadastral_review: 'Registry check',
    plot_status_land_reupload_hint: 'Upload clearer paper',
    plot_status_land_check_delayed_hint: 'Finish backup first',
    plot_status_land_wrong_document_hint: 'Upload correct land paper',
    plot_tenure_doc_reason_check_delayed: 'Still checking after backup',
  };
  let out = table[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      out = out.replace(`{${name}}`, String(value));
    }
  }
  return out;
};

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

  it('handles missing storage path without throwing', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        storage_path: '',
        evidence_label: null,
        parse_status: 'PENDING',
      }),
    );
    expect(detail.label).toBe('Land document');
  });

  it('humanizes land_title_photo evidence labels', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        evidence_label: 'land_title_photo',
        parse_status: 'FAILED',
        parse_result: { error: 'unreadable' },
      }),
      t,
    );
    expect(detail.label).toBe('Land title photo');
  });
});

describe('formatTenureVerificationReviewMessage', () => {
  it('does not expose raw OCR errors to farmers', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_status: 'FAILED',
        parse_result: { error: 'OCR could not read document' },
      }),
    );
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Could not read photo');
  });

  it('maps storage and LLM failures to backup-first copy, not unreadable photo', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_status: 'FAILED',
        parse_result: { error: 'Could not download tenure evidence file.' },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_check_delayed');
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Still checking after backup');
    expect(tenureVerificationRequiresReupload(baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'Could not download tenure evidence file.' },
    }))).toBe(false);
  });

  it('treats readable land papers with low OCR as cooperative review, not unreadable', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_confidence: 0.42,
        parse_result: {
          parser: 'llm',
          tenure_type: 'CUSTOMARY',
          holder_name: 'Maria Lopez',
          confidence_breakdown: { ocr_quality: 0.32, field_completeness: 0.55 },
        },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_manual_review_body');
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Cooperative will check');
  });

  it('humanizes missing clause keys', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: { clauses_missing: ['witness_signatures'] },
      }),
    );
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Needs: Witness signatures');
  });

  it('falls back when clause keys are dev-only tokens', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: { clauses_missing: ['automated_extraction_unavailable'] },
      }),
    );
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Something is missing');
  });

  it('maps cadastral issue codes to plain language', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: {
          cadastral_cross_check: {
            requires_manual_review: true,
            issues: ['cadastral_key_mismatch'],
          },
        },
      }),
    );
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Registry mismatch');
  });

  it('hides low-confidence percentages for blurry photos', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_confidence: 0.42,
        parse_result: {
          parser: 'llm',
          tenure_type: 'UNKNOWN',
          holder_name: null,
          confidence_breakdown: { ocr_quality: 0.3, field_completeness: 0.4 },
        },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_low_confidence');
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Unclear photo');
  });

  it('treats clear unrelated photos as wrong document, not unreadable', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_confidence: 0.42,
        parse_result: {
          parser: 'llm',
          tenure_type: 'UNKNOWN',
          holder_name: null,
          parcel_reference: null,
          confidence_breakdown: { ocr_quality: 0.92, field_completeness: 0.08 },
          summary: 'Photo shows a person outdoors, not a land document.',
        },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_unreadable');
    expect(formatTenureVerificationReviewMessage(detail, t)).toBe('Not a land paper');
  });

  it('maps not_a_land_document clause to wrong-document copy', () => {
    const detail = describeTenureVerificationReview(
      baseRecord({
        parse_result: {
          parser: 'llm',
          tenure_type: 'UNKNOWN',
          clauses_missing: ['not_a_land_document'],
          confidence_breakdown: { ocr_quality: 0.88, field_completeness: 0.1 },
        },
      }),
    );
    expect(detail.reasonKey).toBe('plot_tenure_doc_reason_unreadable');
  });
});

describe('tenureVerificationRequiresReupload', () => {
  it('flags failed and unreadable stubs for re-upload', () => {
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_status: 'FAILED',
          parse_result: { error: 'unreadable' },
        }),
      ),
    ).toBe(true);
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_result: { parser: 'manual_required_stub', clauses_missing: ['automated_extraction_unavailable'] },
        }),
      ),
    ).toBe(false);
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_result: { parser: 'manual_required_stub', clauses_missing: ['not_a_land_document'] },
        }),
      ),
    ).toBe(true);
  });

  it('does not flag cooperative manual review as re-upload', () => {
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_result: { clauses_missing: ['witness_signatures'] },
        }),
      ),
    ).toBe(false);
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_result: {
            cadastral_cross_check: { keys_match: false, requires_manual_review: true },
          },
        }),
      ),
    ).toBe(false);
  });
});

describe('summarizeTenureBlockedBadge', () => {
  it('prioritizes upload again when any file is unreadable', () => {
    expect(
      summarizeTenureBlockedBadge([
        baseRecord({
          parse_result: { clauses_missing: ['witness_signatures'] },
        }),
        baseRecord({
          id: 'v2',
          parse_status: 'FAILED',
          parse_result: { error: 'unreadable' },
        }),
      ]),
    ).toBe('reupload');
  });

  it('shows needs review when only cooperative review is required', () => {
    expect(
      summarizeTenureBlockedBadge([
        baseRecord({
          parse_result: { clauses_missing: ['witness_signatures'] },
        }),
      ]),
    ).toBe('review');
  });
});

describe('tenure review display dedupe', () => {
  it('uses short hints for checklist rows', () => {
    expect(
      resolvePlotLandBlockedShortHint(
        baseRecord({
          parse_status: 'FAILED',
          parse_result: { error: 'OCR could not read document' },
        }),
        t,
      ),
    ).toBe('Upload clearer paper');
    expect(
      resolvePlotLandBlockedShortHint(
        baseRecord({
          parse_confidence: 0.4,
          parse_result: {
            parser: 'llm',
            tenure_type: 'UNKNOWN',
            confidence_breakdown: { ocr_quality: 0.9, field_completeness: 0.1 },
            clauses_missing: ['not_a_land_document'],
          },
        }),
        t,
      ),
    ).toBe('Upload correct land paper');
  });

  it('hides badge when reason box carries re-upload detail', () => {
    const record = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'unreadable' },
    });
    expect(shouldShowTenureDocStatusBadge(record)).toBe(false);
    const detail = describeTenureVerificationReview(record, t);
    const reason = formatTenureVerificationReviewMessage(detail, t);
    expect(shouldShowTenureDocReasonBox(record, detail, reason, new Set())).toBe(true);
  });

  it('does not repeat identical reason text across rows', () => {
    const record = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'unreadable' },
    });
    const detail = describeTenureVerificationReview(record, t);
    const reason = formatTenureVerificationReviewMessage(detail, t);
    const seen = new Set([reason]);
    expect(shouldShowTenureDocReasonBox(record, detail, reason, seen)).toBe(false);
  });

  it('shows checking badge only while pending', () => {
    const record = baseRecord({ parse_status: 'PENDING', parse_result: null });
    const detail = describeTenureVerificationReview(record, t);
    const reason = formatTenureVerificationReviewMessage(detail, t);
    expect(shouldShowTenureDocStatusBadge(record)).toBe(true);
    expect(shouldShowTenureDocReasonBox(record, detail, reason, new Set())).toBe(false);
  });
});
