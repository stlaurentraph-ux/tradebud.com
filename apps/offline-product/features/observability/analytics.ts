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
  OAUTH_SIGN_IN_STARTED: 'oauth_sign_in_started',
  OAUTH_CALLBACK_STARTED: 'oauth_callback_started',
  OAUTH_CALLBACK_SUCCESS: 'oauth_callback_success',
  OAUTH_CALLBACK_FAILURE: 'oauth_callback_failure',
  EMAIL_CONFIRM_SIGNUP_SENT: 'email_confirm_signup_sent',
  EMAIL_CONFIRM_SIGNUP_SESSION: 'email_confirm_signup_session',
  PHOTO_VAULT_CAPTURE_STARTED: 'photo_vault_capture_started',
  PHOTO_VAULT_CAPTURE_SUCCESS: 'photo_vault_capture_success',
  PHOTO_VAULT_CAPTURE_BLOCKED: 'photo_vault_capture_blocked',
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
  PUSH_PERMISSION_DENIED: 'push_permission_denied',
} as const;

export type OAuthAnalyticsSource = 'in_app' | 'cold_start';

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

const FAILURE_EVENTS = new Set<AnalyticsEventName>([
  ANALYTICS_EVENTS.SIGN_IN_FAILURE,
  ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE,
  ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE,
  ANALYTICS_EVENTS.SYNC_ACTION_FAILED,
  ANALYTICS_EVENTS.UI_ACTION_FAILED,
  ANALYTICS_EVENTS.REACT_RENDER_ERROR,
  ANALYTICS_EVENTS.PHOTO_VAULT_CAPTURE_BLOCKED,
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
