import { describe, expect, it } from 'vitest';
import { computePlotReadinessChecklist, evaluateTenureParseGate } from './plotChecklist';

describe('plotChecklist tenure parse gating', () => {
  it('does not block land when only title photos exist', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: [],
      isSyncedToServer: true,
    });
    expect(checklist.landOk).toBe(true);
    expect(checklist.tenureParseGate).toBe('not_applicable');
  });

  it('blocks land when synced tenure parse is MANUAL_REQUIRED', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 0,
      evidenceKinds: ['tenure_evidence'],
      isSyncedToServer: true,
      tenureVerifications: [
        {
          id: 'v1',
          plot_id: 'p1',
          storage_path: 'farmer/p1/tenure_evidence/doc.pdf',
          mime_type: 'application/pdf',
          evidence_label: 'Municipal letter',
          parse_status: 'MANUAL_REQUIRED',
          parse_result: { clauses_missing: ['witness_signatures'] },
          parse_confidence: 0.45,
          parse_reviewed_by: null,
          parse_reviewed_at: null,
          created_at: '2026-06-11T00:00:00.000Z',
          updated_at: '2026-06-11T00:00:00.000Z',
        },
      ],
    });
    expect(checklist.tenureParseGate).toBe('blocked');
    expect(checklist.landOk).toBe(false);
    expect(checklist.done).toBe(false);
  });

  it('clears land when tenure parse is COMPLETED', () => {
    expect(
      evaluateTenureParseGate({
        hasTenureEvidence: true,
        isSyncedToServer: true,
        tenureVerifications: [
          {
            id: 'v1',
            plot_id: 'p1',
            storage_path: 'doc.pdf',
            mime_type: null,
            evidence_label: null,
            parse_status: 'COMPLETED',
            parse_result: null,
            parse_confidence: 0.82,
            parse_reviewed_by: null,
            parse_reviewed_at: null,
            created_at: '',
            updated_at: '',
          },
        ],
      }),
    ).toBe('cleared');
  });
});
