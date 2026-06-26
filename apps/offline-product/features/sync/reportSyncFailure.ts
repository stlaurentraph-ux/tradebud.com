import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { addSentryBreadcrumb } from '@/features/observability/sentryClient';
import { sanitizeAnalyticsProperties } from '@/features/security/sanitizeLogContext';
import type { SyncFailure, SyncFailureStep } from '@/features/sync/syncFailure';

function breadcrumbLevel(failure: SyncFailure): 'info' | 'warning' | 'error' {
  if (failure.cause === 'network' || failure.cause === 'timeout') return 'warning';
  if (failure.cause === 'auth' || failure.cause === 'not_signed_in') return 'warning';
  return 'error';
}

/** Records a classified sync failure for production debugging (Sentry breadcrumb + analytics). */
export function reportSyncFailure(
  failure: SyncFailure,
  context?: Record<string, unknown>,
): void {
  const payload = sanitizeAnalyticsProperties({
    step: failure.step,
    cause: failure.cause,
    actionType: failure.actionType ?? null,
    httpStatus: failure.httpStatus ?? null,
    message: failure.message,
    ...context,
  }) ?? {
    step: failure.step,
    cause: failure.cause,
  };

  addSentryBreadcrumb(`sync:${failure.step}`, payload, breadcrumbLevel(failure));

  trackEvent(ANALYTICS_EVENTS.SYNC_ACTION_FAILED, payload);
}

/** Marks the start of a sync pipeline step (info breadcrumb only). */
export function reportSyncStepStart(
  step: SyncFailureStep,
  context?: Record<string, unknown>,
): void {
  addSentryBreadcrumb(`sync:${step}:start`, context ?? {}, 'info');
}
