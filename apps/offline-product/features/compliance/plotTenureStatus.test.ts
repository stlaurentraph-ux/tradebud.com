import { describe, expect, it } from 'vitest';

import { computePlotTenureStatus } from './plotTenureStatus';

describe('computePlotTenureStatus', () => {
  it('shows formal documented only after land paper check clears', () => {
    const blocked = computePlotTenureStatus({
      informalTenure: false,
      cadastralKey: 'ABC-123',
      titlePhotoCount: 1,
      tenureEvidenceCount: 0,
      tenureParseGate: 'blocked',
    });
    expect(blocked.path).toBe('formal');
    expect(blocked.badge).toBe('documentation_blocked');

    const cleared = computePlotTenureStatus({
      informalTenure: false,
      cadastralKey: 'ABC-123',
      titlePhotoCount: 1,
      tenureEvidenceCount: 0,
      tenureParseGate: 'cleared',
    });
    expect(cleared.badge).toBe('formal_documented');
  });

  it('shows checking badge while review is pending', () => {
    const status = computePlotTenureStatus({
      informalTenure: false,
      cadastralKey: null,
      titlePhotoCount: 0,
      tenureEvidenceCount: 1,
      tenureParseGate: 'pending',
    });
    expect(status.badge).toBe('documentation_reviewing');
  });

  it('shows on-phone badge when documents are not synced yet', () => {
    const status = computePlotTenureStatus({
      informalTenure: false,
      cadastralKey: null,
      titlePhotoCount: 1,
      tenureEvidenceCount: 0,
      tenureParseGate: 'not_synced',
    });
    expect(status.badge).toBe('documentation_local_only');
  });
});
