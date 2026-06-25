import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const linkingMocks = vi.hoisted(() => ({
  getInitialURL: vi.fn<() => Promise<string | null>>(),
  addEventListener: vi.fn(),
}));

vi.mock('expo-linking', () => ({
  getInitialURL: linkingMocks.getInitialURL,
  addEventListener: linkingMocks.addEventListener,
}));

vi.mock('@/features/auth/oauthCallbackUrl', () => ({
  isOAuthCallbackUrl: (url: string) =>
    url.includes('auth/callback') || url.includes('tracebudoffline://'),
}));

import { resolveOAuthColdStartUrl, resolveOAuthColdStartUrlForLaunch } from './resolveOAuthColdStartUrl';

describe('resolveOAuthColdStartUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    linkingMocks.getInitialURL.mockReset();
    linkingMocks.addEventListener.mockReset();
    linkingMocks.addEventListener.mockReturnValue({ remove: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first initial URL when present', async () => {
    linkingMocks.getInitialURL.mockResolvedValue('tracebudoffline://auth/callback?code=abc');
    await expect(resolveOAuthColdStartUrl()).resolves.toBe(
      'tracebudoffline://auth/callback?code=abc',
    );
  });

  it('polls getInitialURL when the first read is null', async () => {
    linkingMocks.getInitialURL
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('tracebudoffline://auth/callback?code=late');
    const promise = resolveOAuthColdStartUrl();
    await vi.advanceTimersByTimeAsync(800);
    await expect(promise).resolves.toBe('tracebudoffline://auth/callback?code=late');
  });

  it('accepts a late Linking url event', async () => {
    vi.useRealTimers();
    linkingMocks.getInitialURL.mockResolvedValue(null);
    let handler: ((event: { url: string }) => void) | undefined;
    linkingMocks.addEventListener.mockImplementation((_event, cb) => {
      handler = cb;
      return { remove: vi.fn() };
    });
    const promise = resolveOAuthColdStartUrl({});
    await Promise.resolve();
    handler?.({ url: 'tracebudoffline://auth/callback?code=event' });
    await expect(promise).resolves.toBe('tracebudoffline://auth/callback?code=event');
    vi.useFakeTimers();
  });

  it('uses a short probe for stale callback routes without a launch URL', async () => {
    const { STALE_OAUTH_CALLBACK_MAX_MS } = await import('./resolveOAuthColdStartUrl');
    linkingMocks.getInitialURL.mockResolvedValue(null);
    const promise = resolveOAuthColdStartUrlForLaunch(null);
    await vi.advanceTimersByTimeAsync(STALE_OAUTH_CALLBACK_MAX_MS + 100);
    await expect(promise).resolves.toBeNull();
  });
});
