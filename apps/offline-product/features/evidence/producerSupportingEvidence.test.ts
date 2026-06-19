import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/api/syncAuthSession', () => ({ hasSyncAuthSession: vi.fn() }));
vi.mock('@/features/api/postPlot', () => ({ fetchPlotsForFarmer: vi.fn() }));
vi.mock('@/features/evidence/syncEvidenceWithFiles', () => ({
  syncPlotEvidenceWithFiles: vi.fn(),
}));
vi.mock('@/features/state/persistence', () => ({
  enqueuePendingSync: vi.fn(),
  loadEvidenceForPlot: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  loadPendingSyncActions: vi.fn(),
  updatePlotEvidenceUri: vi.fn(),
}));

import {
  groupProducerDocsByType,
  matchesProducerSupportingDocType,
  resolveProducerDocSyncStatus,
} from './producerSupportingEvidence';
import {
  PRODUCER_ADDITIONAL_FILE_LABEL,
  PRODUCER_COMMUNITY_FILE_LABEL,
  PRODUCER_LABOR_FILE_LABEL,
} from './producerSupportingFileLabels';
import type { PlotEvidenceItem } from '@/features/state/persistence';

const base = (overrides: Partial<PlotEvidenceItem>): PlotEvidenceItem => ({
  id: 1,
  plotId: 'profile:farmer-1',
  kind: 'fpic_repository',
  uri: 'file:///tmp/letter.pdf',
  mimeType: 'application/pdf',
  label: PRODUCER_COMMUNITY_FILE_LABEL,
  takenAt: Date.now(),
  ...overrides,
});

describe('matchesProducerSupportingDocType', () => {
  it('groups community, labor, and additional separately', () => {
    const docs = [
      base({ id: 1, label: PRODUCER_COMMUNITY_FILE_LABEL, kind: 'fpic_repository' }),
      base({ id: 2, label: PRODUCER_LABOR_FILE_LABEL, kind: 'labor_evidence' }),
      base({ id: 3, label: PRODUCER_ADDITIONAL_FILE_LABEL, kind: 'labor_evidence' }),
    ];
    expect(
      groupProducerDocsByType(docs, {
        kind: 'fpic_repository',
        label: PRODUCER_COMMUNITY_FILE_LABEL,
      }),
    ).toHaveLength(1);
    expect(
      groupProducerDocsByType(docs, { kind: 'labor_evidence', label: PRODUCER_LABOR_FILE_LABEL }),
    ).toHaveLength(1);
    expect(
      groupProducerDocsByType(docs, {
        kind: 'labor_evidence',
        label: PRODUCER_ADDITIONAL_FILE_LABEL,
      }),
    ).toHaveLength(1);
    expect(
      matchesProducerSupportingDocType(docs[2]!, {
        kind: 'labor_evidence',
        label: PRODUCER_ADDITIONAL_FILE_LABEL,
      }),
    ).toBe(true);
  });
});

describe('resolveProducerDocSyncStatus', () => {
  it('marks remote uri as on tracebud', () => {
    expect(
      resolveProducerDocSyncStatus({
        item: base({ uri: 'https://cdn.example/signed.pdf' }),
        isSignedIn: true,
        hasSyncedPlot: true,
        pendingProducerSync: false,
      }),
    ).toBe('on_tracebud');
  });

  it('marks local uri as sign in required when signed out', () => {
    expect(
      resolveProducerDocSyncStatus({
        item: base({}),
        isSignedIn: false,
        hasSyncedPlot: true,
        pendingProducerSync: false,
      }),
    ).toBe('sign_in_required');
  });
});
