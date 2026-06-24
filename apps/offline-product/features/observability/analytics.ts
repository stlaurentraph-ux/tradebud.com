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
  OAUTH_STEP: 'oauth_step',
  OAUTH_BROWSER_FALLBACK: 'oauth_browser_fallback',
  OAUTH_CALLBACK_STARTED: 'oauth_callback_started',
  OAUTH_CALLBACK_SUCCESS: 'oauth_callback_success',
  OAUTH_CALLBACK_FAILURE: 'oauth_callback_failure',
  EMAIL_CONFIRM_SIGNUP_SENT: 'email_confirm_signup_sent',
  EMAIL_CONFIRM_SIGNUP_SESSION: 'email_confirm_signup_session',
  PHOTO_VAULT_CAPTURE_STARTED: 'photo_vault_capture_started',
  PHOTO_VAULT_CAPTURE_SUCCESS: 'photo_vault_capture_success',
  PHOTO_VAULT_CAPTURE_BLOCKED: 'photo_vault_capture_blocked',
  GEOMETRY_CONFIDENCE_ASSESSED: 'geometry_confidence_assessed',
  GEOMETRY_CONFIDENCE_CTA_CLICKED: 'geometry_confidence_cta_clicked',
  GEOMETRY_PRE_UPLOAD_REVIEW_SHOWN: 'geometry_pre_upload_review_shown',
  GEOMETRY_PRE_UPLOAD_REVIEW_TRACE: 'geometry_pre_upload_review_trace',
  GEOMETRY_PRE_UPLOAD_REVIEW_SAVE_ANYWAY: 'geometry_pre_upload_review_save_anyway',
  MANUAL_TRACE_STARTED: 'manual_trace_started',
  MANUAL_TRACE_SAVED: 'manual_trace_saved',
  MANUAL_TRACE_IMAGERY_BLOCKED: 'manual_trace_imagery_blocked',
  GEOMETRY_LOW_CONFIDENCE_SAVED: 'geometry_low_confidence_saved',
  PLOT_CREATED: 'plot_created',
  HARVEST_SUBMIT_SUCCESS: 'harvest_submit_success',
  HARVEST_SUBMIT_FAILURE: 'harvest_submit_failure',
  MULTI_PLOT_DELIVERY_STARTED: 'multi_plot_delivery_started',
  MULTI_PLOT_DELIVERY_SUBMITTED: 'multi_plot_delivery_submitted',
  DELIVERY_RECEIPT_REMOVED_FROM_DEVICE: 'delivery_receipt_removed_from_device',
  DELIVERY_INTAKE_ADVISORY_SHOWN: 'delivery_intake_advisory_shown',
  CAMPAIGN_INVITE_DEEP_LINK_OPENED: 'campaign_invite_deep_link_opened',
  CAMPAIGN_INVITE_CLAIMED_ON_BOOTSTRAP: 'campaign_invite_claimed_on_bootstrap',
  CAMPAIGN_INVITE_BANNER_SHOWN: 'campaign_invite_banner_shown',
  CAMPAIGN_INVITE_BANNER_CTA: 'campaign_invite_banner_cta',
  CAMPAIGN_INVITE_BANNER_DISMISSED: 'campaign_invite_banner_dismissed',
  CAMPAIGN_INVITE_FULFILLMENT_SUCCESS: 'campaign_invite_fulfillment_success',
  SHOW_BUYER_QR_OPENED: 'show_buyer_qr_opened',
  SYNC_QUEUE_DRAINED: 'sync_queue_drained',
  SYNC_RUN_COMPLETED: 'sync_run_completed',
  FIELD_SYNC_DELTA_SKIPPED: 'field_sync_delta_skipped',
  FIELD_SYNC_INCREMENTAL_RESTORE: 'field_sync_incremental_restore',
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
  WHY_TRACEBUD_VIEWED: 'why_tracebud_viewed',
  ENUMERATION_MODE_ENTERED: 'enumeration_mode_entered',
  ENUMERATION_MEMBER_SELECTED: 'enumeration_member_selected',
  ENUMERATION_PROVISIONAL_CREATED: 'enumeration_provisional_created',
  ENUMERATION_DUPLICATE_WARNING_SHOWN: 'enumeration_duplicate_warning_shown',
  ENUMERATION_ROSTER_PREFETCHED: 'enumeration_roster_prefetched',
  TILE_BOOTSTRAP_PROMPT_SHOWN: 'tile_bootstrap_prompt_shown',
  TILE_BOOTSTRAP_CONFIRMED: 'tile_bootstrap_confirmed',
  TILE_BOOTSTRAP_DECLINED: 'tile_bootstrap_declined',
  TILE_BOOTSTRAP_DOWNLOAD_STARTED: 'tile_bootstrap_download_started',
  TILE_BOOTSTRAP_DOWNLOAD_SUCCEEDED: 'tile_bootstrap_download_succeeded',
  TILE_BOOTSTRAP_DOWNLOAD_FAILED: 'tile_bootstrap_download_failed',
  ENUMERATION_CAPTURE_INTENT_FULL_BOUNDARY: 'enumeration_capture_intent_full_boundary',
  ENUMERATION_PLOT_COMPLETED: 'enumeration_plot_completed',
  WHY_TRACEBUD_HOME_TEASER_CLICKED: 'why_tracebud_home_teaser_clicked',
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
