import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitConsumeResult = {
  allowed: boolean;
};

export interface RateLimitStore {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitConsumeResult>;
}

type MemoryBucket = { count: number; resetAt: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, MemoryBucket>();

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitConsumeResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { count: 0, resetAt: now + windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    this.buckets.set(key, bucket);
    return { allowed: bucket.count <= limit };
  }

  clearForTests(): void {
    this.buckets.clear();
  }
}

function windowLabel(windowMs: number): `${number} s` | `${number} ms` {
  if (windowMs % 1000 === 0) {
    return `${windowMs / 1000} s`;
  }
  return `${windowMs} ms`;
}

export class UpstashRateLimitStore implements RateLimitStore {
  private readonly limiters = new Map<string, Ratelimit>();

  constructor(private readonly redis: Redis) {}

  private limiterFor(limit: number, windowMs: number): Ratelimit {
    const cacheKey = `${limit}:${windowMs}`;
    const existing = this.limiters.get(cacheKey);
    if (existing) return existing;

    const limiter = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(limit, windowLabel(windowMs)),
      prefix: `tracebud:rl:${cacheKey}`,
      analytics: false,
    });
    this.limiters.set(cacheKey, limiter);
    return limiter;
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitConsumeResult> {
    const result = await this.limiterFor(limit, windowMs).limit(key);
    return { allowed: result.success };
  }
}

let activeStore: RateLimitStore | null = null;

export function resolveRateLimitStoreKind(): 'memory' | 'upstash' {
  if (process.env.RATE_LIMIT_STORE === 'memory') return 'memory';
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return 'upstash';
  return 'memory';
}

export function createRateLimitStore(): RateLimitStore {
  if (resolveRateLimitStoreKind() === 'upstash') {
    return new UpstashRateLimitStore(
      new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
    );
  }
  return new MemoryRateLimitStore();
}

export function getRateLimitStore(): RateLimitStore {
  if (!activeStore) {
    activeStore = createRateLimitStore();
  }
  return activeStore;
}

export function resetRateLimitStoreForTests(): void {
  if (activeStore instanceof MemoryRateLimitStore) {
    activeStore.clearForTests();
  }
  activeStore = new MemoryRateLimitStore();
  process.env.RATE_LIMIT_STORE = 'memory';
}
