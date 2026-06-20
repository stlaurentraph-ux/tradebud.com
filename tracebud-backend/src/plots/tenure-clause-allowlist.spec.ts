import { isTenureGeometryClause, sanitizeTenureParseClauses } from './tenure-clause-allowlist';
import type { TenureParseResultV1 } from './tenure-parse.types';

describe('tenure-clause-allowlist', () => {
  it('flags geometry-related clause tokens', () => {
    expect(isTenureGeometryClause('gps_coordinates')).toBe(true);
    expect(isTenureGeometryClause('witness_signatures')).toBe(false);
  });

  it('strips geometry clauses from parse results', () => {
    const result: TenureParseResultV1 = {
      tenure_type: 'CUSTOMARY',
      holder_name: 'Maria',
      community_or_issuer: 'Village',
      parcel_reference: null,
      issue_date: null,
      country_iso: 'HN',
      clauses_found: ['occupation_rights'],
      clauses_missing: ['gps_coordinates', 'community_consent'],
      anti_fraud: {
        metadata_timestamp_plausible: true,
        issuer_name_match: true,
        document_age_within_policy: true,
      },
      confidence_breakdown: { ocr_quality: 0.9, field_completeness: 0.8 },
      summary: null,
      parser: 'llm',
    };
    const sanitized = sanitizeTenureParseClauses(result);
    expect(sanitized.clauses_missing).toEqual(['community_consent']);
    expect(sanitized.clauses_found).toEqual(['occupation_rights']);
  });
});
