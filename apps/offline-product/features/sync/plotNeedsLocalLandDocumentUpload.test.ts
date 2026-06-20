import { describe, expect, it } from 'vitest';

import { plotNeedsLocalLandDocumentUpload } from './plotNeedsLocalLandDocumentUpload';

describe('plotNeedsLocalLandDocumentUpload', () => {
  it('returns true when synced plot has local land docs but no server tenure row', () => {
    expect(
      plotNeedsLocalLandDocumentUpload({
        hasLandDocuments: true,
        isSyncedToServer: true,
        tenureVerifications: [],
      }),
    ).toBe(true);
  });

  it('returns false when plot is not on server yet', () => {
    expect(
      plotNeedsLocalLandDocumentUpload({
        hasLandDocuments: true,
        isSyncedToServer: false,
        tenureVerifications: [],
      }),
    ).toBe(false);
  });

  it('returns false when tenure check is already pending on server', () => {
    expect(
      plotNeedsLocalLandDocumentUpload({
        hasLandDocuments: true,
        isSyncedToServer: true,
        tenureVerifications: [
          {
            id: 'v1',
            plot_id: 'p1',
            storage_path: 'path',
            mime_type: null,
            evidence_label: null,
            parse_status: 'PENDING',
          },
        ],
      }),
    ).toBe(false);
  });

  it('returns false when there are no land documents', () => {
    expect(
      plotNeedsLocalLandDocumentUpload({
        hasLandDocuments: false,
        isSyncedToServer: true,
        tenureVerifications: [],
      }),
    ).toBe(false);
  });
});
