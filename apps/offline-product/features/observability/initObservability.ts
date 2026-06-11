import { ANALYTICS_EVENTS, trackEvent } from './analytics';
import { initSentryClient } from './sentryClient';

let bootstrapped = false;

/** Idempotent startup: Sentry client + first session breadcrumb. */
export function initObservability(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const sentryReady = initSentryClient();
  trackEvent(ANALYTICS_EVENTS.SESSION_START, { sentryReady });
}
