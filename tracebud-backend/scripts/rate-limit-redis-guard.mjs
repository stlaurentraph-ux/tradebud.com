#!/usr/bin/env node
/**
 * Audit H3 — distributed rate limiting via Upstash Redis with memory fallback for dev/tests.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(backendRoot, relPath), 'utf8');
}

const middleware = read('src/http/rate-limit.middleware.ts');
const store = read('src/http/rate-limit-store.ts');
const main = read('src/main.ts');
const pkg = JSON.parse(read('package.json'));

if (!middleware.includes('resolveRateLimitPolicy')) {
  console.error('rate-limit-redis-guard: middleware must resolve per-route policy');
  process.exit(1);
}
if (!middleware.includes('isPublicRoute')) {
  console.error('rate-limit-redis-guard: middleware must detect /v1/public/* routes');
  process.exit(1);
}
if (!middleware.includes('MAX_REQUESTS_PUBLIC_PRODUCTION')) {
  console.error('rate-limit-redis-guard: middleware must define stricter public limits');
  process.exit(1);
}
if (!middleware.includes('getRateLimitStore')) {
  console.error('rate-limit-redis-guard: middleware must use shared rate-limit store');
  process.exit(1);
}
if (!store.includes('UpstashRateLimitStore')) {
  console.error('rate-limit-redis-guard: rate-limit-store.ts must define UpstashRateLimitStore');
  process.exit(1);
}
if (!store.includes('Ratelimit.slidingWindow')) {
  console.error('rate-limit-redis-guard: Upstash limiter must use slidingWindow');
  process.exit(1);
}
if (!main.includes('createRateLimitMiddleware')) {
  console.error('rate-limit-redis-guard: main.ts must wire rate-limit middleware');
  process.exit(1);
}
if (!pkg.dependencies?.['@upstash/ratelimit'] || !pkg.dependencies?.['@upstash/redis']) {
  console.error('rate-limit-redis-guard: package.json must depend on @upstash/ratelimit and @upstash/redis');
  process.exit(1);
}

console.log('rate-limit-redis-guard: OK');
