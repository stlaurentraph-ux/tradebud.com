import { describe, expect, it } from 'vitest';

import { pendingSyncDedupKey } from './pendingSyncDedup';

describe('pendingSyncDedupKey audit_sync', () => {
  it('dedupes producer attestations per farmer', () => {
    const payloadJson = JSON.stringify({
      eventType: 'producer_attestations_updated',
      payload: { farmerId: 'farmer-1' },
    });
    expect(pendingSyncDedupKey('audit_sync', payloadJson)).toBe('audit_sync:producer:farmer-1');
  });

  it('dedupes plot compliance per plot', () => {
    const payloadJson = JSON.stringify({
      eventType: 'plot_compliance_declared',
      payload: { plotId: 'plot-1', farmerId: 'farmer-1' },
    });
    expect(pendingSyncDedupKey('audit_sync', payloadJson)).toBe('audit_sync:plot:plot-1');
  });
});
