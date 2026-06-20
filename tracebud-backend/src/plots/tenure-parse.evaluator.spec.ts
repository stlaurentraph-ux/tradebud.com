import { computeParseConfidence, evaluateTenureParseResult } from './tenure-parse.evaluator';
import type { TenureParseResultV1 } from './tenure-parse.types';

function baseResult(overrides: Partial<TenureParseResultV1> = {}): TenureParseResultV1 {
  return {
    tenure_type: 'CUSTOMARY',
    holder_name: 'Maria Lopez',
    community_or_issuer: 'Comunidad El Progreso',
    parcel_reference: 'Lote 12',
    issue_date: '2021-05-01',
    country_iso: 'HN',
    clauses_found: ['occupation_rights'],
    clauses_missing: [],
    anti_fraud: {
      metadata_timestamp_plausible: true,
      issuer_name_match: true,
      document_age_within_policy: true,
    },
    confidence_breakdown: { ocr_quality: 0.85, field_completeness: 0.8 },
    summary: 'Customary possession letter',
    parser: 'llm',
    ...overrides,
  };
}

describe('tenure-parse.evaluator', () => {
  it('completes when confidence is high and no missing clauses', () => {
    const result = evaluateTenureParseResult(baseResult());
    expect(result.parse_status).toBe('COMPLETED');
    expect(result.parse_confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('requires manual review when confidence is low', () => {
    const result = evaluateTenureParseResult(
      baseResult({
        confidence_breakdown: { ocr_quality: 0.4, field_completeness: 0.3 },
      }),
    );
    expect(result.parse_status).toBe('MANUAL_REQUIRED');
  });

  it('caps confidence when anti-fraud flags fail', () => {
    const confidence = computeParseConfidence(
      baseResult({
        anti_fraud: {
          metadata_timestamp_plausible: false,
          issuer_name_match: true,
          document_age_within_policy: true,
        },
      }),
    );
    expect(confidence).toBeLessThanOrEqual(0.5);
  });

  it('requires manual review for stub parser', () => {
    const result = evaluateTenureParseResult(
      baseResult({ parser: 'manual_required_stub', confidence_breakdown: { ocr_quality: 1, field_completeness: 1 } }),
    );
    expect(result.parse_status).toBe('MANUAL_REQUIRED');
    expect(result.parse_confidence).toBe(0);
  });

  it('fails when the document is not a land paper', () => {
    const result = evaluateTenureParseResult(
      baseResult({
        tenure_type: 'UNKNOWN',
        holder_name: null,
        community_or_issuer: null,
        parcel_reference: null,
        clauses_found: [],
        clauses_missing: ['not_a_land_document'],
        confidence_breakdown: { ocr_quality: 0.92, field_completeness: 0.08 },
        summary: 'Photo shows a person outdoors, not a land document.',
      }),
    );
    expect(result.parse_status).toBe('FAILED');
  });

  it('fails when document country does not match plot country', () => {
    const result = evaluateTenureParseResult(
      baseResult({
        jurisdiction_cross_check: {
          plot_country_iso: 'NO',
          document_country_iso: 'IN',
          document_country_match: false,
          issuer_text: null,
          issuer_inferred_country_iso: null,
          issuer_jurisdiction_match: null,
          document_admin_regions: [],
          plot_admin_regions: [],
          admin_region_match: null,
          issues: ['document_country_mismatch'],
          exporter_hints: [],
          requires_manual_review: false,
          auto_fail: true,
        },
      }),
    );
    expect(result.parse_status).toBe('FAILED');
  });
});
