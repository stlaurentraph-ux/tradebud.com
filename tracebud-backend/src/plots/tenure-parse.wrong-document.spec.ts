import { isFarmerWrongDocumentOutcome, parseResultHasWrongDocumentClause } from './tenure-parse.wrong-document';

describe('tenure-parse.wrong-document', () => {
  it('detects not_a_land_document clause', () => {
    expect(
      parseResultHasWrongDocumentClause({
        clauses_missing: ['not_a_land_document'],
      }),
    ).toBe(true);
  });

  it('treats wrong-document FAILED as farmer-correctable (no exporter queue)', () => {
    expect(
      isFarmerWrongDocumentOutcome('FAILED', {
        clauses_missing: ['not_a_land_document'],
      }),
    ).toBe(true);
    expect(
      isFarmerWrongDocumentOutcome('MANUAL_REQUIRED', {
        clauses_missing: ['not_a_land_document'],
      }),
    ).toBe(false);
  });
});
