import type { NodeOptions } from '@sentry/nestjs';

export function getSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  const dsn = getSentryDsn();
  if (!dsn) return false;
  if (process.env.SENTRY_ENABLED === '0') return false;
  if (process.env.SENTRY_ENABLED === '1') return true;
  return process.env.NODE_ENV === 'production';
}

export function getSentryEnvironment(): string {
  const explicit = process.env.SENTRY_ENVIRONMENT?.trim();
  if (explicit) {
    return explicit;
  }

  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME?.trim();
  if (railwayEnv === 'production') {
    return 'production';
  }
  if (railwayEnv) {
    return 'staging';
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getBaseSentryOptions(): NodeOptions {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  };
}
