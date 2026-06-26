import type { NextFunction, Request, Response } from 'express';
import { recordRateLimit429 } from './rate-limit-observability';
import { getRateLimitStore, resetRateLimitStoreForTests } from './rate-limit-store';

export const WINDOW_MS = 60_000;
export const MAX_REQUESTS_ANON = 120;
export const MAX_REQUESTS_AUTH_PRODUCTION = 240;
export const MAX_REQUESTS_AUDIT_WRITE_PRODUCTION = 60;
export const MAX_REQUESTS_PUBLIC_PRODUCTION = 30;

function readRequestUrl(req: Request): string {
  return String(req.originalUrl ?? req.url ?? '');
}

export function isAuditWriteRequest(req: Request): boolean {
  const url = readRequestUrl(req);
  const method = req.method?.toUpperCase() ?? 'GET';
  return method === 'POST' && (url.includes('/v1/audit/batch') || /\/v1\/audit(?:\/|$|\?)/.test(url));
}

export function isPublicRoute(req: Request): boolean {
  return readRequestUrl(req).includes('/v1/public/');
}

export function isRateLimitExempt(req: Request): boolean {
  const url = readRequestUrl(req);
  const method = req.method?.toUpperCase() ?? 'GET';
  if (method === 'GET') {
    if (
      url.includes('/v1/me/field-farmer-ids') ||
      url.includes('/v1/me/field-sync-delta') ||
      url.includes('/v1/plots') ||
      url.includes('/v1/audit') ||
      url.includes('/v1/harvest/vouchers') ||
      url === '/api/health' ||
      url.startsWith('/api/health?') ||
      url === '/health'
    ) {
      return true;
    }
  }
  if (method === 'POST' && url.includes('/v1/me/field-app-bootstrap')) return true;
  return false;
}

function readClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(
    req.ip ||
      (typeof forwardedIp === 'string' ? forwardedIp.split(',')[0]?.trim() : undefined) ||
      req.socket?.remoteAddress ||
      'unknown',
  );
}

export function jwtSubFromAuthorizationHeader(authHeader: unknown): string | null {
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
  const parts = authHeader.slice('Bearer '.length).trim().split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      sub?: unknown;
    };
    return typeof payload.sub === 'string' && payload.sub.trim() ? payload.sub.trim() : null;
  } catch {
    return null;
  }
}

export function resolveRateLimitKey(req: Request): string {
  const sub = jwtSubFromAuthorizationHeader(req.headers.authorization);
  return sub ? `user:${sub}` : `ip:${readClientIp(req)}`;
}

export function resolveRateLimitPolicy(req: Request): {
  namespace: string;
  limit: number;
  windowMs: number;
} {
  if (isPublicRoute(req)) {
    return {
      namespace: 'public',
      limit:
        process.env.NODE_ENV === 'production'
          ? MAX_REQUESTS_PUBLIC_PRODUCTION
          : Math.max(MAX_REQUESTS_PUBLIC_PRODUCTION, 120),
      windowMs: WINDOW_MS,
    };
  }
  if (isAuditWriteRequest(req)) {
    return {
      namespace: 'audit-write',
      limit:
        process.env.NODE_ENV === 'production'
          ? MAX_REQUESTS_AUDIT_WRITE_PRODUCTION
          : Math.max(MAX_REQUESTS_AUDIT_WRITE_PRODUCTION, 300),
      windowMs: WINDOW_MS,
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    return { namespace: 'default', limit: Math.max(MAX_REQUESTS_ANON, 600), windowMs: WINDOW_MS };
  }
  return {
    namespace: 'default',
    limit: req.headers.authorization ? MAX_REQUESTS_AUTH_PRODUCTION : MAX_REQUESTS_ANON,
    windowMs: WINDOW_MS,
  };
}

export function createRateLimitMiddleware(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req, res, next) => {
    if (isRateLimitExempt(req)) {
      next();
      return;
    }

    void (async () => {
      const policy = resolveRateLimitPolicy(req);
      const storeKey = `${policy.namespace}:${resolveRateLimitKey(req)}`;
      const result = await getRateLimitStore().consume(storeKey, policy.limit, policy.windowMs);
      if (!result.allowed) {
        recordRateLimit429(req);
        res.status(429).json({ message: 'Too many requests, please slow down.' });
        return;
      }
      next();
    })().catch((error) => {
      console.error('[rate-limit] store error', error);
      next();
    });
  };
}

export function resetRateLimitBucketsForTests(): void {
  resetRateLimitStoreForTests();
}
