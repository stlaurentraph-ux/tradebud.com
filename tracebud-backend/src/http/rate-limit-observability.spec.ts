import {
  normalizeRateLimitRouteLabel,
  recordRateLimit429,
  resetRateLimit429ObservabilityForTests,
} from './rate-limit-observability';

describe('rate-limit observability', () => {
  beforeEach(() => resetRateLimit429ObservabilityForTests());

  it('labels audit POST routes', () => {
    expect(normalizeRateLimitRouteLabel('POST', '/api/v1/audit')).toBe('POST /v1/audit');
    recordRateLimit429({ method: 'POST', originalUrl: '/api/v1/audit' } as any);
  });
});
