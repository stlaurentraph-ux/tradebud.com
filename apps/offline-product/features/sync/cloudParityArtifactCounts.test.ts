import { describe, expect, it } from 'vitest';
import {
  countServerDeclarationSignals,
  countServerPhotosFromAudit,
  gapCount,
  serverHasActiveWalkDraft,
  serverHasProfilePhotoAudit,
} from './cloudParityArtifactCounts';

describe('countServerPhotosFromAudit', () => {
  it('counts latest ground and land title photos per server plot', () => {
    const counts = countServerPhotosFromAudit([
      {
        event_type: 'plot_photos_synced',
        payload: { kind: 'ground_truth', plotId: 'sp1', photos: [{ uri: 'a' }, { uri: 'b' }] },
      },
      {
        event_type: 'plot_photos_synced',
        payload: { kind: 'land_title', plotId: 'sp1', photos: [{ uri: 'c' }] },
      },
      {
        event_type: 'plot_photos_synced',
        payload: { kind: 'ground_truth', plotId: 'sp1', photos: [{ uri: 'old' }] },
        timestamp: '2020-01-01T00:00:00Z',
      },
    ]);
    expect(counts.groundTruth).toBe(2);
    expect(counts.landTitle).toBe(1);
  });
});

describe('serverHasProfilePhotoAudit', () => {
  it('returns true when storage path present', () => {
    expect(
      serverHasProfilePhotoAudit([
        {
          event_type: 'farmer_profile_photo_synced',
          payload: { storagePath: 'farmer/x.jpg' },
        },
      ]),
    ).toBe(true);
  });

  it('returns false when cleared', () => {
    expect(
      serverHasProfilePhotoAudit([
        {
          event_type: 'farmer_profile_photo_synced',
          payload: { cleared: true },
        },
      ]),
    ).toBe(false);
  });
});

describe('serverHasActiveWalkDraft', () => {
  it('returns true when save is newer than clear', () => {
    expect(
      serverHasActiveWalkDraft([
        {
          event_type: 'plot_mapping_draft_saved',
          timestamp: '2026-06-20T12:00:00Z',
        },
        {
          event_type: 'plot_mapping_draft_cleared',
          timestamp: '2026-06-19T12:00:00Z',
        },
      ]),
    ).toBe(true);
  });
});

describe('countServerDeclarationSignals', () => {
  it('counts unique plot attestation audits', () => {
    const signals = countServerDeclarationSignals([
      { event_type: 'producer_attestations_updated', payload: {} },
      { event_type: 'plot_compliance_declared', payload: { plotId: 'a' } },
      { event_type: 'plot_compliance_declared', payload: { plotId: 'a' } },
      { event_type: 'plot_legal_synced', payload: {} },
    ]);
    expect(signals.producerAudit).toBe(true);
    expect(signals.plotAttestations).toBe(1);
    expect(signals.legalSynced).toBe(1);
  });
});

describe('gapCount', () => {
  it('returns zero when server unknown', () => {
    expect(gapCount(null, 3)).toBe(0);
  });

  it('returns positive gap', () => {
    expect(gapCount(5, 2)).toBe(3);
  });
});
