import { describe, expect, it } from 'vitest';

import { buildEvidenceStoragePath } from '@/features/evidence/buildEvidenceStoragePath';

describe('buildEvidenceStoragePath', () => {
  it('builds a stable path from local row id', () => {
    expect(
      buildEvidenceStoragePath({
        authUserId: '66b5dafa-0000-4000-8000-000000000001',
        plotId: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        kind: 'land_title',
        stableKey: 42,
        label: 'land_title_photo',
      }),
    ).toBe(
      '66b5dafa-0000-4000-8000-000000000001/686b9ff6-acf7-40ff-9bb0-2d96f060bb78/land_title/42-land_title_photo',
    );
  });

  it('sanitizes unsafe label characters', () => {
    expect(
      buildEvidenceStoragePath({
        authUserId: 'user-1',
        plotId: 'plot-1',
        kind: 'tenure_evidence',
        stableKey: 'doc-7',
        label: 'my land paper (2024).pdf',
      }),
    ).toBe('user-1/plot-1/tenure_evidence/doc-7-my_land_paper_2024_.pdf');
  });
});
