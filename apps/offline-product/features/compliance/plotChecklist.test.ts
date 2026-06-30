import { describe, expect, it } from 'vitest';
import {
  computePlotReadinessChecklist,
  evaluateTenureParseGate,
  resolveLandDocumentsUiStatus,
} from './plotChecklist';

describe('plotChecklist tenure parse gating', () => {
  it('marks sync done only when linked AND no pending queue rows (U3)', () => {
    const linked = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: ['tenure_evidence'],
      isSyncedToServer: true,
      hasPendingQueueRows: false,
      tenureVerifications: [],
    });
    expect(linked.syncOk).toBe(true);

    const linkedWithQueue = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: ['tenure_evidence'],
      isSyncedToServer: true,
      hasPendingQueueRows: true,
      tenureVerifications: [],
    });
    expect(linkedWithQueue.syncOk).toBe(false);
  });

  it('treats synced plot with local title photo but no server check as awaiting upload', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: [],
      isSyncedToServer: true,
      tenureVerifications: [],
    });
    expect(checklist.tenureParseGate).toBe('documents_local_only');
    expect(checklist.landOk).toBe(true);
    expect(
      resolveLandDocumentsUiStatus({
        titlePhotoCount: 1,
        evidenceKinds: [],
        tenureParseGate: checklist.tenureParseGate,
      }),
    ).toBe('awaiting_upload');
  });

  it('waits for AI when tenure verification rows exist on a synced plot', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: [],
      isSyncedToServer: true,
      tenureVerifications: [
        {
          id: 'v1',
          plot_id: 'p1',
          storage_path: 'farmer/p1/land_title/title.jpg',
          mime_type: 'image/jpeg',
          evidence_label: 'land_title_photo',
          parse_status: 'PENDING',
          parse_result: null,
          parse_confidence: null,
          parse_reviewed_by: null,
          parse_reviewed_at: null,
          created_at: '2026-06-11T00:00:00.000Z',
          updated_at: '2026-06-11T00:00:00.000Z',
        },
      ],
    });
    expect(checklist.landOk).toBe(true);
    expect(checklist.tenureParseGate).toBe('pending');
    expect(
      resolveLandDocumentsUiStatus({
        titlePhotoCount: 1,
        evidenceKinds: [],
        tenureParseGate: checklist.tenureParseGate,
      }),
    ).toBe('reviewing');
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

  it('blocks land when synced land title parse is MANUAL_REQUIRED', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: [],
      isSyncedToServer: true,
      tenureVerifications: [
        {
          id: 'v1',
          plot_id: 'p1',
          storage_path: 'farmer/p1/land_title/title.jpg',
          mime_type: 'image/jpeg',
          evidence_label: 'Land title photo',
          parse_status: 'MANUAL_REQUIRED',
          parse_result: { parser: 'manual_required_stub' },
          parse_confidence: 0,
          parse_reviewed_by: null,
          parse_reviewed_at: null,
          created_at: '2026-06-11T00:00:00.000Z',
          updated_at: '2026-06-11T00:00:00.000Z',
        },
      ],
    });
    expect(checklist.tenureParseGate).toBe('blocked');
    expect(checklist.landOk).toBe(false);
  });

  it('does not mark land papers verified while AI is reviewing', () => {
    expect(
      resolveLandDocumentsUiStatus({
        titlePhotoCount: 1,
        evidenceKinds: [],
        tenureParseGate: 'pending',
      }),
    ).toBe('reviewing');
    expect(
      resolveLandDocumentsUiStatus({
        titlePhotoCount: 1,
        evidenceKinds: [],
        tenureParseGate: 'cleared',
      }),
    ).toBe('verified');
  });

  it('clears land when tenure parse is COMPLETED', () => {
    expect(
      evaluateTenureParseGate({
        hasLandDocuments: true,
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

  it('counts producer FPIC repository toward indigenous overlap checklist', () => {
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotoCount: 4,
      titlePhotoCount: 1,
      evidenceKinds: [],
      producerEvidenceKinds: ['fpic_repository'],
      isSyncedToServer: true,
      backendFlags: { indigenous_overlap: true },
    });
    expect(checklist.fpicOk).toBe(true);
    expect(checklist.done).toBe(true);
  });
});
