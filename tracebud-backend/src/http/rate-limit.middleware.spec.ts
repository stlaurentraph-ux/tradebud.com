import {
  createRateLimitMiddleware,
  isRateLimitExempt,
  resetRateLimitBucketsForTests,
} from './rate-limit.middleware';

describe('rate-limit middleware', () => {
  beforeEach(() => resetRateLimitBucketsForTests());

  it('does not exempt audit POST routes (H8)', () => {
    expect(isRateLimitExempt({ method: 'POST', originalUrl: '/api/v1/audit' } as any)).toBe(
      false,
    );
    expect(
      isRateLimitExempt({ method: 'POST', originalUrl: '/api/v1/audit/batch' } as any),
    ).toBe(false);
  });

  it('exempts audit GET routes', () => {
    expect(
      isRateLimitExempt({ method: 'GET', originalUrl: '/api/v1/audit/gated-entry' } as any),
    ).toBe(true);
  });

  it('returns 429 for audit POST after cap', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const middleware = createRateLimitMiddleware();
    const req = { method: 'POST', originalUrl: '/api/v1/audit', headers: {}, ip: '1.1.1.1' } as any;
    const res = {
      statusCode: 200,
      status(c: number) {
        this.statusCode = c;
        return this;
      },
      json() {
        return this;
      },
    };
    const next = jest.fn();
    for (let i = 0; i < 61; i += 1) middleware(req, res as any, next);
    expect(res.statusCode).toBe(429);
    process.env.NODE_ENV = prev;
  });
});
