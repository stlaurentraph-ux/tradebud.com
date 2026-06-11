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
  return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
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
