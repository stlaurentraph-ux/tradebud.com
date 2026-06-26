import type { NextFunction, Request, Response } from 'express';
import { recordRateLimit429 } from './rate-limit-observability';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_ANON = 120;
const MAX_REQUESTS_AUTH_PRODUCTION = 240;
const MAX_REQUESTS_AUDIT_WRITE_PRODUCTION = 60;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function readRequestUrl(req: Request): string {
  return String(req.originalUrl ?? req.url ?? '');
}

function isAuditWriteRequest(req: Request): boolean {
  const url = readRequestUrl(req);
  const method = req.method?.toUpperCase() ?? 'GET';
  return method === 'POST' && (url.includes('/v1/audit/batch') || /\/v1\/audit(?:\/|$|\?)/.test(url));
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

function resolveMaxRequests(req: Request): number {
  if (isAuditWriteRequest(req)) {
    return process.env.NODE_ENV === 'production'
      ? MAX_REQUESTS_AUDIT_WRITE_PRODUCTION
      : Math.max(MAX_REQUESTS_AUDIT_WRITE_PRODUCTION, 300);
  }
  if (process.env.NODE_ENV !== 'production') return Math.max(MAX_REQUESTS_ANON, 600);
  return req.headers.authorization ? MAX_REQUESTS_AUTH_PRODUCTION : MAX_REQUESTS_ANON;
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
    const key = resolveRateLimitKey(req);
    const now = Date.now();
    const bucket = buckets.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + WINDOW_MS;
    }
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > resolveMaxRequests(req)) {
      recordRateLimit429(req);
      res.status(429).json({ message: 'Too many requests, please slow down.' });
      return;
    }
    next();
  };
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
