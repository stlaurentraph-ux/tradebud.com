import {
  addSentryBreadcrumb,
  captureAnalyticsSignal,
  isSentryEnabled,
  setSentryUser,
} from './sentryClient';

export const ANALYTICS_EVENTS = {
  SESSION_START: 'session_start',
  SIGN_IN_SUCCESS: 'sign_in_success',
  SIGN_IN_FAILURE: 'sign_in_failure',
  PLOT_CREATED: 'plot_created',
  HARVEST_SUBMIT_SUCCESS: 'harvest_submit_success',
  HARVEST_SUBMIT_FAILURE: 'harvest_submit_failure',
  SYNC_QUEUE_DRAINED: 'sync_queue_drained',
  SYNC_ACTION_FAILED: 'sync_action_failed',
  UI_ACTION_FAILED: 'ui_action_failed',
  REACT_RENDER_ERROR: 'react_render_error',
  DATA_PROCESSING_CONSENT_ACCEPTED: 'data_processing_consent_accepted',
  BACKUP_CONFIRMED: 'backup_confirmed',
  BACKUP_DECLINED: 'backup_declined',
  CONSENT_GRANT_APPROVED: 'consent_grant_approved',
  CONSENT_GRANT_DENIED: 'consent_grant_denied',
  CONSENT_GRANT_REVOKED: 'consent_grant_revoked',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

const FAILURE_EVENTS = new Set<AnalyticsEventName>([
  ANALYTICS_EVENTS.SIGN_IN_FAILURE,
  ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE,
  ANALYTICS_EVENTS.SYNC_ACTION_FAILED,
  ANALYTICS_EVENTS.UI_ACTION_FAILED,
  ANALYTICS_EVENTS.REACT_RENDER_ERROR,
]);

export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, unknown>,
): void {
  if (__DEV__) {
    console.log('[Analytics]', name, properties ?? {});
  }

  if (!isSentryEnabled()) return;

  const level = FAILURE_EVENTS.has(name) ? 'warning' : 'info';
  addSentryBreadcrumb(name, properties, level);
  if (FAILURE_EVENTS.has(name)) {
    captureAnalyticsSignal(name, properties, 'warning');
  }
}

export function trackUiActionFailure(
  action: string,
  properties?: Record<string, unknown>,
): void {
  trackEvent(ANALYTICS_EVENTS.UI_ACTION_FAILED, { action, ...properties });
}

export function setAnalyticsUser(farmerId: string | null | undefined): void {
  if (!farmerId) {
    setSentryUser(null);
    return;
  }
  setSentryUser({ id: farmerId });
}
