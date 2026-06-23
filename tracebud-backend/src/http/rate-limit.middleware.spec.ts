import type { Request } from 'express';
import {
  createRateLimitMiddleware,
  isRateLimitExempt,
  jwtSubFromAuthorizationHeader,
  resetRateLimitBucketsForTests,
  resolveRateLimitKey,
} from './rate-limit.middleware';

function mockReq(partial: Partial<Request> & { originalUrl?: string }): Request {
  return partial as Request;
}

describe('rate-limit middleware', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests();
  });

  it('exempts field restore GET routes', () => {
    expect(
      isRateLimitExempt(
        mockReq({ method: 'GET', originalUrl: '/api/v1/harvest/vouchers/mine' }),
      ),
    ).toBe(true);
    expect(
      isRateLimitExempt(
        mockReq({ method: 'GET', originalUrl: '/api/v1/plots/abc/synced-evidence' }),
      ),
    ).toBe(true);
    expect(
      isRateLimitExempt(
        mockReq({ method: 'GET', originalUrl: '/api/v1/me/field-sync-delta?since=1' }),
      ),
    ).toBe(true);
  });

  it('exempts audit POST routes', () => {
    expect(
      isRateLimitExempt(mockReq({ method: 'POST', originalUrl: '/api/v1/audit' })),
    ).toBe(true);
    expect(
      isRateLimitExempt(mockReq({ method: 'POST', originalUrl: '/api/v1/audit/batch' })),
    ).toBe(true);
  });

  it('resolves user bucket from JWT sub', () => {
    const header =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature';
    expect(jwtSubFromAuthorizationHeader(header)).toBe('user-123');
    expect(
      resolveRateLimitKey(
        mockReq({ headers: { authorization: header }, ip: '1.2.3.4' }),
      ),
    ).toBe('user:user-123');
  });

  it('returns 429 after max requests for the same key', () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const middleware = createRateLimitMiddleware();
    const req = mockReq({
      method: 'POST',
      originalUrl: '/api/v1/harvest',
      headers: { authorization: 'Bearer test' },
      ip: '9.9.9.9',
    });
    const res = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };
    const next = jest.fn();

    for (let i = 0; i < 240; i += 1) {
      middleware(req, res as any, next);
    }
    expect(next).toHaveBeenCalledTimes(240);

    middleware(req, res as any, next);
    expect(res.statusCode).toBe(429);
    expect(next).toHaveBeenCalledTimes(240);

    process.env.NODE_ENV = prevEnv;
  });
});
