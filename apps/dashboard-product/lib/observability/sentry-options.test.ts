import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSentryEnvironment } from './sentry-options';

describe('getSentryEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers explicit NEXT_PUBLIC_SENTRY_ENVIRONMENT', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'staging');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSentryEnvironment()).toBe('staging');
  });

  it('maps Vercel preview to staging', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSentryEnvironment()).toBe('staging');
  });

  it('maps Vercel production to production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'development');
    expect(getSentryEnvironment()).toBe('production');
  });

  it('falls back to development locally', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getSentryEnvironment()).toBe('development');
  });
});
