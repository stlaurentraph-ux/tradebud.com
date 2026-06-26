import { MemoryRateLimitStore } from './rate-limit-store';

describe('MemoryRateLimitStore', () => {
  it('allows requests within the sliding window cap', async () => {
    const store = new MemoryRateLimitStore();
    const first = await store.consume('ip:1.1.1.1', 2, 60_000);
    const second = await store.consume('ip:1.1.1.1', 2, 60_000);
    const third = await store.consume('ip:1.1.1.1', 2, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
