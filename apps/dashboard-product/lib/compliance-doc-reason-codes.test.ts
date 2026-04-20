import { describe, expect, it } from 'vitest';
import { evaluateComplianceEvidenceRequirements } from './compliance-doc-reason-codes';

describe('evaluateComplianceEvidenceRequirements', () => {
  it('returns fail with blocking reason codes', () => {
    const result = evaluateComplianceEvidenceRequirements(
      [
        {
          id: 'ev-1',
          type: 'field_report',
          title: 'Field Report',
          status: 'rejected',
          date: '2025-01-01',
          source: 'Inspector',
        },
      ],
      ['Government Clearance Letter'],
      new Date('2026-04-16T00:00:00Z'),
    );

    expect(result.status).toBe('fail');
    expect(result.reasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(['DOC_REJECTED', 'DOC_MISSING']),
    );
  });

  it('returns warning for stale or pending evidence', () => {
    const result = evaluateComplianceEvidenceRequirements(
      [
        {
          id: 'ev-2',
          type: 'satellite_imagery',
          title: 'Sentinel Image',
          status: 'pending',
          date: '2024-01-01',
          source: 'ESA',
        },
      ],
      [],
      new Date('2026-04-16T00:00:00Z'),
    );

    expect(result.status).toBe('warning');
    expect(result.reasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(['DOC_PENDING_REVIEW', 'DOC_STALE']),
    );
  });

  it('returns pass when all evidence is valid and verified', () => {
    const result = evaluateComplianceEvidenceRequirements(
      [
        {
          id: 'ev-3',
          type: 'certification',
          title: 'Certification',
          status: 'verified',
          date: '2026-04-01',
          source: 'Registry',
        },
      ],
      [],
      new Date('2026-04-16T00:00:00Z'),
    );

    expect(result.status).toBe('pass');
    expect(result.reasons).toHaveLength(0);
  });
});
