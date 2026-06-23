import {
  getRateLimit429Snapshot,
  normalizeRateLimitRouteLabel,
  recordRateLimit429,
  resetRateLimit429ObservabilityForTests,
} from './rate-limit-observability';

describe('rate-limit observability', () => {
  beforeEach(() => {
    resetRateLimit429ObservabilityForTests();
  });

  it('normalizes plot evidence and audit routes', () => {
    expect(
      normalizeRateLimitRouteLabel(
        'GET',
        '/api/v1/plots/abc/synced-evidence?farmerId=x',
      ),
    ).toBe('GET /v1/plots/*/synced-evidence');
    expect(normalizeRateLimitRouteLabel('POST', '/api/v1/audit/batch')).toBe(
      'POST /v1/audit/batch',
    );
    expect(normalizeRateLimitRouteLabel('POST', '/api/v1/audit')).toBe('POST /v1/audit');
  });

  it('aggregates 429 counts by route label', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/audit',
    } as any;

    recordRateLimit429(req);
    recordRateLimit429(req);

    const snapshot = getRateLimit429Snapshot();
    expect(snapshot.total429).toBe(2);
    expect(snapshot.byRoute['POST /v1/audit']).toBe(2);
  });
});
