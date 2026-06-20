import {
  applyTenureJurisdictionCrossCheck,
  buildTenureJurisdictionCrossCheck,
  inferCountryIsoFromText,
} from './tenure-jurisdiction-check';
import type { PlotCadastralContext } from './cadastral-cross-check';
import type { TenureParseResultV1 } from './tenure-parse.types';

const baseContext = (overrides: Partial<PlotCadastralContext> = {}): PlotCadastralContext => ({
  declaredCadastralKey: null,
  informalTenure: false,
  farmerName: 'Hector',
  countryCode: 'NO',
  postalAddress: null,
  ...overrides,
});

const baseResult = (overrides: Partial<TenureParseResultV1> = {}): TenureParseResultV1 => ({
  tenure_type: 'CUSTOMARY',
  holder_name: 'Hector',
  community_or_issuer: 'Community letter',
  parcel_reference: null,
  issue_date: '2024-01-01',
  country_iso: null,
  clauses_found: [],
  clauses_missing: [],
  anti_fraud: {
    metadata_timestamp_plausible: true,
    issuer_name_match: true,
    document_age_within_policy: true,
  },
  confidence_breakdown: { ocr_quality: 0.9, field_completeness: 0.8 },
  summary: null,
  parser: 'llm',
  ...overrides,
});

describe('tenure-jurisdiction-check', () => {
  it('infers India from issuer text', () => {
    expect(inferCountryIsoFromText('Revenue Department, Karnataka')).toBe('IN');
  });

  it('flags document country mismatch (India doc / Norway plot)', () => {
    const check = buildTenureJurisdictionCrossCheck({
      parseResult: baseResult({ country_iso: 'IN', community_or_issuer: 'Karnataka Revenue' }),
      context: baseContext({ countryCode: 'NO' }),
    });
    expect(check.document_country_match).toBe(false);
    expect(check.issues).toContain('document_country_mismatch');
    expect(check.auto_fail).toBe(true);
  });

  it('flags issuer jurisdiction when document country matches plot but issuer text does not', () => {
    const check = buildTenureJurisdictionCrossCheck({
      parseResult: baseResult({
        country_iso: 'HN',
        community_or_issuer: 'Revenue Department, Karnataka',
      }),
      context: baseContext({ countryCode: 'HN' }),
    });
    expect(check.document_country_match).toBe(true);
    expect(check.issuer_inferred_country_iso).toBe('IN');
    expect(check.issues).toContain('issuer_jurisdiction_mismatch');
    expect(check.requires_manual_review).toBe(true);
    expect(check.auto_fail).toBe(false);
  });

  it('adds exporter admin region hints without auto-fail', () => {
    const check = buildTenureJurisdictionCrossCheck({
      parseResult: baseResult({
        country_iso: 'IN',
        community_or_issuer: 'Revenue Department Karnataka',
      }),
      context: baseContext({ countryCode: 'IN', postalAddress: 'Tamil Nadu district office' }),
    });
    expect(check.auto_fail).toBe(false);
    expect(check.exporter_hints.some((hint) => hint.startsWith('admin_region_hint:'))).toBe(true);
  });

  it('merges jurisdiction cross-check onto parse result', () => {
    const merged = applyTenureJurisdictionCrossCheck(
      baseResult({ country_iso: 'NO' }),
      baseContext({ countryCode: 'NO' }),
    );
    expect(merged.jurisdiction_cross_check?.document_country_match).toBe(true);
  });
});
