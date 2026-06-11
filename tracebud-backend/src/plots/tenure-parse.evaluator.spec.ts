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
});
