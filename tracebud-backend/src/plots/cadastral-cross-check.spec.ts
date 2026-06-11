import {
  applyCadastralCrossCheck,
  cadastralKeysMatch,
  holderNameMatchesFarmer,
  normalizeCadastralKey,
} from './cadastral-cross-check';
import type { TenureParseResultV1 } from './tenure-parse.types';

const baseResult = (): TenureParseResultV1 => ({
  tenure_type: 'FORMAL',
  holder_name: 'Maria Lopez',
  community_or_issuer: 'Municipality',
  parcel_reference: '012-345-678-9',
  title_number: null,
  issue_date: '2020-01-01',
  country_iso: 'HN',
  clauses_found: [],
  clauses_missing: [],
  anti_fraud: {
    metadata_timestamp_plausible: true,
    issuer_name_match: true,
    document_age_within_policy: true,
  },
  confidence_breakdown: { ocr_quality: 0.9, field_completeness: 0.85 },
  summary: null,
  parser: 'llm',
});

describe('cadastral-cross-check', () => {
  it('normalizes Honduras 10-digit clave', () => {
    expect(normalizeCadastralKey('0123456789')).toBe('012-345-678-9');
    expect(cadastralKeysMatch('0123456789', '012-345-678-9')).toBe(true);
  });

  it('detects cadastral mismatch', () => {
    expect(cadastralKeysMatch('012-345-678-9', '999-999-999-9')).toBe(false);
  });

  it('matches holder names fuzzily', () => {
    expect(holderNameMatchesFarmer('Maria Elena Lopez', 'Maria Lopez')).toBe(true);
    expect(holderNameMatchesFarmer('John Smith', 'Maria Lopez')).toBe(false);
  });

  it('flags informal tenure conflict with formal document', () => {
    const result = applyCadastralCrossCheck(baseResult(), {
      declaredCadastralKey: '012-345-678-9',
      informalTenure: true,
      farmerName: 'Maria Lopez',
    }, 'land_title');
    expect(result.cadastral_cross_check?.informal_tenure_conflict).toBe(true);
    expect(result.cadastral_cross_check?.requires_manual_review).toBe(true);
  });

  it('passes when declared and extracted keys align', () => {
    const result = applyCadastralCrossCheck(baseResult(), {
      declaredCadastralKey: '0123456789',
      informalTenure: false,
      farmerName: 'Maria Lopez',
    }, 'land_title');
    expect(result.cadastral_cross_check?.keys_match).toBe(true);
    expect(result.cadastral_cross_check?.issues).not.toContain('cadastral_key_mismatch');
  });
});
