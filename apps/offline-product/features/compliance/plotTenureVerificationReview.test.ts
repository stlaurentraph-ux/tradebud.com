import { describe, expect, it } from 'vitest';

import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import {
  classifyTenureDocFarmerOutcome,
  describeTenureVerificationReview,
  formatTenureVerificationReviewMessage,
  summarizeTenureBlockedBadge,
  tenureVerificationRequiresReupload,
  shouldShowTenureDocReasonBox,
  shouldShowTenureDocStatusBadge,
  resolvePlotLandBlockedShortHint,
} from './plotTenureVerificationReview';

const t = (key: string) => {
  const table: Record<string, string> = {
    plot_tenure_doc_label_land_title: 'Land title photo',
    plot_tenure_doc_outcome_checking: 'Still checking…',
    plot_tenure_doc_outcome_fix_upload: 'Please upload again.',
    plot_tenure_doc_hint_hard_to_read: 'Hard to read.',
    plot_tenure_doc_hint_missing_parts: 'Missing parts.',
    plot_tenure_doc_hint_missing_signature: 'Missing signature.',
    plot_tenure_doc_hint_not_land_paper: 'Not a land paper.',
    plot_tenure_doc_hint_land_id_mismatch: 'Land ID mismatch.',
    plot_tenure_doc_hint_queued: 'Queued.',
    plot_status_land_parse_blocked: 'Land papers need a check',
  };
  return table[key] ?? key;
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

describe('classifyTenureDocFarmerOutcome', () => {
  it('maps completed parses to good', () => {
    expect(
      classifyTenureDocFarmerOutcome(baseRecord({ parse_status: 'COMPLETED', parse_result: {} })),
    ).toBe('good');
  });

  it('maps farmer-fixable issues to fix_upload', () => {
    const blurry = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'OCR could not read document' },
    });
    const wrongDoc = baseRecord({
      parse_result: {
        parser: 'llm',
        tenure_type: 'UNKNOWN',
        clauses_missing: ['not_a_land_document'],
        confidence_breakdown: { ocr_quality: 0.88, field_completeness: 0.1 },
      },
    });
    const missing = baseRecord({
      parse_result: { clauses_missing: ['witness_signatures'] },
    });

    expect(classifyTenureDocFarmerOutcome(blurry)).toBe('fix_upload');
    expect(classifyTenureDocFarmerOutcome(wrongDoc)).toBe('fix_upload');
    expect(classifyTenureDocFarmerOutcome(missing)).toBe('fix_upload');
  });

  it('maps cooperative and queue states to checking', () => {
    const queue = baseRecord({
      parse_status: 'MANUAL_REQUIRED',
      parse_result: {
        parser: 'manual_required_stub',
        clauses_missing: ['automated_extraction_unavailable'],
      },
    });
    const service = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'Could not download tenure evidence file.' },
    });
    const coop = baseRecord({
      parse_confidence: 0.42,
      parse_result: {
        parser: 'llm',
        tenure_type: 'CUSTOMARY',
        holder_name: 'Maria Lopez',
        confidence_breakdown: { ocr_quality: 0.32, field_completeness: 0.55 },
      },
    });
    const cadastral = baseRecord({
      parse_result: {
        cadastral_cross_check: {
          requires_manual_review: true,
          issues: ['cadastral_key_mismatch'],
        },
      },
    });

    expect(classifyTenureDocFarmerOutcome(queue)).toBe('checking');
    expect(classifyTenureDocFarmerOutcome(service)).toBe('checking');
    expect(classifyTenureDocFarmerOutcome(coop)).toBe('checking');
    expect(classifyTenureDocFarmerOutcome(cadastral)).toBe('checking');
  });
});

describe('formatTenureVerificationReviewMessage', () => {
  it('returns no copy for good outcomes', () => {
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({ parse_status: 'COMPLETED', parse_result: {} }),
        t,
      ),
    ).toBe('');
  });

  it('returns one checking line for queue and cooperative review', () => {
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({
          parse_status: 'PENDING',
          parse_result: null,
        }),
        t,
      ),
    ).toBe('Still checking… Queued.');
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({
          parse_result: {
            cadastral_cross_check: {
              requires_manual_review: true,
              issues: ['cadastral_key_mismatch'],
            },
          },
        }),
        t,
      ),
    ).toBe('Still checking… Land ID mismatch.');
  });

  it('returns fix-upload line with a precise hint for each farmer-fixable issue', () => {
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({
          parse_status: 'FAILED',
          parse_result: { error: 'OCR could not read document' },
        }),
        t,
      ),
    ).toBe('Please upload again. Hard to read.');
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({
          parse_result: { clauses_missing: ['witness_signatures'] },
        }),
        t,
      ),
    ).toBe('Please upload again. Missing signature.');
    expect(
      formatTenureVerificationReviewMessage(
        baseRecord({
          parse_result: {
            parser: 'llm',
            tenure_type: 'UNKNOWN',
            clauses_missing: ['not_a_land_document'],
            confidence_breakdown: { ocr_quality: 0.88, field_completeness: 0.1 },
          },
        }),
        t,
      ),
    ).toBe('Please upload again. Not a land paper.');
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

  it('flags missing clauses as re-upload', () => {
    expect(
      tenureVerificationRequiresReupload(
        baseRecord({
          parse_result: { clauses_missing: ['witness_signatures'] },
        }),
      ),
    ).toBe(true);
  });

  it('does not flag cooperative manual review as re-upload', () => {
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
  it('prioritizes upload again when any file needs a fix', () => {
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
          parse_result: {
            cadastral_cross_check: { keys_match: false, requires_manual_review: true },
          },
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
    ).toBe('Please upload again. Hard to read.');
    expect(
      resolvePlotLandBlockedShortHint(
        baseRecord({
          parse_result: {
            cadastral_cross_check: { keys_match: false, requires_manual_review: true },
          },
        }),
        t,
      ),
    ).toBe('Still checking… Land ID mismatch.');
  });

  it('hides badge when upload-again badge carries the action', () => {
    const record = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'unreadable' },
    });
    expect(shouldShowTenureDocStatusBadge(record)).toBe(false);
    const reason = formatTenureVerificationReviewMessage(record, t);
    expect(shouldShowTenureDocReasonBox(record, reason, new Set())).toBe(true);
  });

  it('does not repeat identical reason text across rows', () => {
    const record = baseRecord({
      parse_status: 'FAILED',
      parse_result: { error: 'unreadable' },
    });
    const reason = formatTenureVerificationReviewMessage(record, t);
    const seen = new Set([reason]);
    expect(shouldShowTenureDocReasonBox(record, reason, seen)).toBe(false);
  });

  it('shows no reason box for good outcomes', () => {
    const record = baseRecord({ parse_status: 'COMPLETED', parse_result: {} });
    const reason = formatTenureVerificationReviewMessage(record, t);
    expect(shouldShowTenureDocStatusBadge(record)).toBe(true);
    expect(shouldShowTenureDocReasonBox(record, reason, new Set())).toBe(false);
  });

  it('shows one checking line while pending', () => {
    const record = baseRecord({ parse_status: 'PENDING', parse_result: null });
    const reason = formatTenureVerificationReviewMessage(record, t);
    expect(shouldShowTenureDocStatusBadge(record)).toBe(true);
    expect(reason).toBe('Still checking… Queued.');
    expect(shouldShowTenureDocReasonBox(record, reason, new Set())).toBe(true);
  });
});
