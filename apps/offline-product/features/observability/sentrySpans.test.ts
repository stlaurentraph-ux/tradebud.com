import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => {
  const span = {
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
  };
  return {
    isSentryEnabled: vi.fn(() => true),
    startSpan: vi.fn(
      async (
        _options: unknown,
        callback: (activeSpan: typeof span) => Promise<unknown>,
      ) => callback(span),
    ),
    getActiveSpan: vi.fn(() => span),
    span,
  };
});

vi.mock('@/features/observability/sentryClient', () => ({
  isSentryEnabled: sentryMocks.isSentryEnabled,
  Sentry: {
    startSpan: sentryMocks.startSpan,
    getActiveSpan: sentryMocks.getActiveSpan,
  },
}));

import {
  annotateActiveSentrySpan,
  markActiveSentrySpanError,
  withSentrySpan,
} from './sentrySpans';

describe('sentrySpans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentryMocks.isSentryEnabled.mockReturnValue(true);
  });

  it('no-ops when Sentry is disabled', async () => {
    sentryMocks.isSentryEnabled.mockReturnValue(false);
    const value = await withSentrySpan(
      { name: 'test.span', op: 'test' },
      async () => 'ok',
    );
    expect(value).toBe('ok');
    expect(sentryMocks.startSpan).not.toHaveBeenCalled();
  });

  it('runs callback inside startSpan and redacts sensitive attributes', async () => {
    await withSentrySpan(
      {
        name: 'sync.pipeline',
        op: 'sync.pipeline',
        attributes: { plot_count: 2, accessToken: 'secret' },
      },
      async (span) => {
        span.setAttribute('sync.step', 'queue_drain');
      },
    );

    expect(sentryMocks.startSpan).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sync.pipeline',
        op: 'sync.pipeline',
        attributes: expect.objectContaining({
          plot_count: 2,
          accessToken: '[redacted]',
        }),
      }),
      expect.any(Function),
    );
    expect(sentryMocks.span.setAttribute).toHaveBeenCalledWith('sync.step', 'queue_drain');
  });

  it('marks span error and rethrows when callback throws', async () => {
    await expect(
      withSentrySpan({ name: 'oauth.sign_in', op: 'auth.oauth' }, async () => {
        throw new Error('sign_in_oauth_failed');
      }),
    ).rejects.toThrow('sign_in_oauth_failed');

    expect(sentryMocks.span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: 'sign_in_oauth_failed',
    });
  });

  it('annotates the active span', () => {
    annotateActiveSentrySpan({ sync_cause: 'timeout', email: 'a@b.com' });
    expect(sentryMocks.span.setAttribute).toHaveBeenCalledWith('sync_cause', 'timeout');
    expect(sentryMocks.span.setAttribute).toHaveBeenCalledWith('email', '[redacted]');
  });

  it('marks active span error with attributes', () => {
    markActiveSentrySpanError('boot_failed', { scope: 'app_state_boot' });
    expect(sentryMocks.span.setAttribute).toHaveBeenCalledWith('scope', 'app_state_boot');
    expect(sentryMocks.span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: 'boot_failed',
    });
  });
});
