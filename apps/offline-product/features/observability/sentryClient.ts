import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let initialized = false;

function resolveDsn(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { sentryDsn?: string } | undefined;
  return extra?.sentryDsn?.trim() || undefined;
}

function shouldEnableSentry(dsn: string | undefined): boolean {
  if (!dsn) return false;
  if (process.env.EXPO_PUBLIC_SENTRY_ENABLED === '1') return true;
  if (process.env.EXPO_PUBLIC_SENTRY_ENABLED === '0') return false;
  // Default: report from preview/production builds, not local dev.
  return !__DEV__;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function initSentryClient(): boolean {
  if (initialized) return true;

  const dsn = resolveDsn();
  if (!shouldEnableSentry(dsn)) return false;

  Sentry.init({
    dsn,
    debug: process.env.EXPO_PUBLIC_SENTRY_DEBUG === '1',
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.15,
    attachStacktrace: true,
    environment: __DEV__ ? 'development' : process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
    release: `tracebud-offline@${Constants.expoConfig?.version ?? 'unknown'}`,
  });

  initialized = true;
  return true;
}

export function setSentryUser(params: { id: string } | null): void {
  if (!initialized) return;
  if (!params) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: params.id });
}

export function reportErrorToSentry(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_logger', context);
      for (const [key, value] of Object.entries(context)) {
        scope.setTag(key, String(value));
      }
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    Sentry.captureMessage(String(error), 'error');
  });
}

export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info',
): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    category: 'analytics',
    message,
    data,
    level,
  });
}

export function captureAnalyticsSignal(
  eventName: string,
  properties?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info',
): void {
  if (!initialized) return;
  addSentryBreadcrumb(eventName, properties, level);
  if (level === 'warning' || level === 'error') {
    Sentry.captureMessage(`analytics:${eventName}`, { level, extra: properties });
  }
}

export { Sentry };
