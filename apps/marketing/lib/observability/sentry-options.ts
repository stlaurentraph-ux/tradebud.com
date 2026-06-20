import type { BrowserOptions, EdgeOptions, NodeOptions } from '@sentry/nextjs';

export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  const dsn = getSentryDsn();
  if (!dsn) return false;
  if (process.env.NEXT_PUBLIC_SENTRY_ENABLED === '0') return false;
  if (process.env.NEXT_PUBLIC_SENTRY_ENABLED === '1') return true;
  return process.env.NODE_ENV === 'production';
}

export function getSentryEnvironment(): string {
  const explicit = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim();
  if (explicit) {
    return explicit;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === 'production') {
    return 'production';
  }
  if (vercelEnv === 'preview') {
    return 'staging';
  }
  if (vercelEnv === 'development') {
    return 'development';
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getBaseSentryOptions(): NodeOptions & BrowserOptions & EdgeOptions {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  };
}
