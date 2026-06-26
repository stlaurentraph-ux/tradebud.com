import {
  createRateLimitMiddleware,
  isPublicRoute,
  isRateLimitExempt,
  MAX_REQUESTS_PUBLIC_PRODUCTION,
  resetRateLimitBucketsForTests,
  resolveRateLimitPolicy,
} from './rate-limit.middleware';
import { resolveRateLimitStoreKind } from './rate-limit-store';

async function invokeMiddleware(
  middleware: ReturnType<typeof createRateLimitMiddleware>,
  req: unknown,
  res: { statusCode: number; status(c: number): unknown; json(): unknown },
): Promise<'next' | 'limited'> {
  return new Promise((resolve) => {
    let settled = false;
    middleware(req as any, res as any, () => {
      if (!settled) {
        settled = true;
        resolve('next');
      }
    });
    setImmediate(() => {
      if (!settled && res.statusCode === 429) {
        settled = true;
        resolve('limited');
      }
    });
  });
}

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

  it('does not exempt public POST routes (H3)', () => {
    expect(
      isRateLimitExempt({
        method: 'POST',
        originalUrl: '/api/v1/public/requests/campaigns/decision-intent',
      } as any),
    ).toBe(false);
    expect(
      isPublicRoute({
        method: 'POST',
        originalUrl: '/api/v1/public/requests/campaigns/decision-intent',
      } as any),
    ).toBe(true);
  });

  it('exempts audit GET routes', () => {
    expect(
      isRateLimitExempt({ method: 'GET', originalUrl: '/api/v1/audit/gated-entry' } as any),
    ).toBe(true);
  });

  it('applies stricter public limits in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const policy = resolveRateLimitPolicy({
      method: 'POST',
      originalUrl: '/api/v1/public/requests/campaigns/decision-intent',
      headers: {},
    } as any);
    expect(policy.namespace).toBe('public');
    expect(policy.limit).toBe(MAX_REQUESTS_PUBLIC_PRODUCTION);
    process.env.NODE_ENV = prev;
  });

  it('returns 429 for audit POST after cap', async () => {
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
    for (let i = 0; i < 61; i += 1) {
      const outcome = await invokeMiddleware(middleware, req, res as any);
      if (i < 60) expect(outcome).toBe('next');
    }
    expect(res.statusCode).toBe(429);
    process.env.NODE_ENV = prev;
  });

  it('returns 429 for public POST after stricter cap', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const middleware = createRateLimitMiddleware();
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/public/requests/campaigns/decision-intent',
      headers: {},
      ip: '2.2.2.2',
    } as any;
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
    for (let i = 0; i < MAX_REQUESTS_PUBLIC_PRODUCTION + 1; i += 1) {
      await invokeMiddleware(middleware, req, res as any);
    }
    expect(res.statusCode).toBe(429);
    process.env.NODE_ENV = prev;
  });

  it('defaults to memory store when Upstash env is unset', () => {
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.RATE_LIMIT_STORE = 'memory';
    expect(resolveRateLimitStoreKind()).toBe('memory');
    process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
  });
});
