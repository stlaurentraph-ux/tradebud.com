import { describe, expect, it } from 'vitest';
import { getGatedEntryContext, getGatedEntrySessionKey } from './gated-entry-analytics';

describe('gated entry analytics helpers', () => {
  it('returns null when feature marker is missing or invalid', () => {
    expect(getGatedEntryContext(null, 'annual_reporting')).toBeNull();
    expect(getGatedEntryContext('other_feature', 'annual_reporting')).toBeNull();
  });

  it('returns null for unknown gate values', () => {
    expect(getGatedEntryContext('mvp_gated', null)).toBeNull();
    expect(getGatedEntryContext('mvp_gated', 'unknown_gate')).toBeNull();
  });

  it('returns normalized context for known deferred gates', () => {
    expect(getGatedEntryContext('mvp_gated', 'annual_reporting')).toEqual({
      feature: 'mvp_gated',
      gate: 'annual_reporting',
    });
    expect(getGatedEntryContext('mvp_gated', 'request_campaigns')).toEqual({
      feature: 'mvp_gated',
      gate: 'request_campaigns',
    });
  });

  it('builds stable session dedupe key by gate context', () => {
    const key = getGatedEntrySessionKey({
      feature: 'mvp_gated',
      gate: 'request_campaigns',
    });
    expect(key).toBe('tb:gated-entry:mvp_gated:request_campaigns');
  });
});
