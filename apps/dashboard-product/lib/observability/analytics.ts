import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';

import { isSentryEnabled } from '@/lib/observability/sentry-options';

export const DASHBOARD_EVENTS = {
  SESSION_START: 'dashboard_session_start',
  SIGN_IN_SUCCESS: 'dashboard_sign_in_success',
  SIGN_IN_FAILURE: 'dashboard_sign_in_failure',
  PACKAGE_CREATE_SUCCESS: 'dashboard_package_create_success',
  PACKAGE_CREATE_FAILURE: 'dashboard_package_create_failure',
  PACKAGE_SEAL_SUCCESS: 'dashboard_package_seal_success',
  PACKAGE_SEAL_FAILURE: 'dashboard_package_seal_failure',
  EXPORTER_LINEAGE_STEP_CLICKED: 'dashboard_exporter_lineage_step_clicked',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  UI_ACTION_FAILED: 'dashboard_ui_action_failed',
  REACT_RENDER_ERROR: 'dashboard_react_render_error',
  UPSTREAM_BLOCKER_ALERT_CLICKED: 'dashboard_upstream_blocker_alert_clicked',
  PLOT_GEOMETRY_REVISION_APPLIED: 'plot_geometry_revision_applied',
  CAMPAIGN_CREATE_SUCCESS: 'dashboard_campaign_create_success',
  CAMPAIGN_CREATE_FAILURE: 'dashboard_campaign_create_failure',
  CAMPAIGN_SEND_SUCCESS: 'dashboard_campaign_send_success',
  CAMPAIGN_SEND_FAILURE: 'dashboard_campaign_send_failure',
  INBOX_RESPOND_SUCCESS: 'dashboard_inbox_respond_success',
  INBOX_RESPOND_FAILURE: 'dashboard_inbox_respond_failure',
  CAMPAIGN_ARCHIVE_SUCCESS: 'dashboard_campaign_archive_success',
  CAMPAIGN_ARCHIVE_FAILURE: 'dashboard_campaign_archive_failure',
  CONTACT_STATUS_CHANGED: 'dashboard_contact_status_changed',
  CONTACT_STATUS_CHANGE_FAILURE: 'dashboard_contact_status_change_failure',
  CONTACT_CREATE_SUCCESS: 'dashboard_contact_create_success',
  CONTACT_CREATE_FAILURE: 'dashboard_contact_create_failure',
  ISSUE_STATUS_CHANGED: 'dashboard_issue_status_changed',
  ISSUE_STATUS_CHANGE_FAILURE: 'dashboard_issue_status_change_failure',
  ISSUE_CREATE_SUCCESS: 'dashboard_issue_create_success',
  ISSUE_REMEDIATION_CLICKED: 'dashboard_issue_remediation_clicked',
} as const;

export type DashboardEventName = (typeof DASHBOARD_EVENTS)[keyof typeof DASHBOARD_EVENTS];

type DashboardEventProps = Record<string, string | number | boolean | undefined>;

const FAILURE_EVENTS = new Set<DashboardEventName>([
  DASHBOARD_EVENTS.SIGN_IN_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_CREATE_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_SEAL_FAILURE,
  DASHBOARD_EVENTS.UI_ACTION_FAILED,
  DASHBOARD_EVENTS.REACT_RENDER_ERROR,
  DASHBOARD_EVENTS.CAMPAIGN_CREATE_FAILURE,
  DASHBOARD_EVENTS.CAMPAIGN_SEND_FAILURE,
  DASHBOARD_EVENTS.INBOX_RESPOND_FAILURE,
  DASHBOARD_EVENTS.CAMPAIGN_ARCHIVE_FAILURE,
  DASHBOARD_EVENTS.CONTACT_STATUS_CHANGE_FAILURE,
  DASHBOARD_EVENTS.CONTACT_CREATE_FAILURE,
  DASHBOARD_EVENTS.ISSUE_STATUS_CHANGE_FAILURE,
]);

function compactProps(properties?: DashboardEventProps): Record<string, string | number | boolean> {
  if (!properties) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function trackDashboardEvent(
  name: DashboardEventName | string,
  properties?: DashboardEventProps,
): void {
  const props = compactProps(properties);

  if (process.env.NODE_ENV === 'development') {
    console.log('[DashboardAnalytics]', name, props);
  }

  track(name, props);

  if (!isSentryEnabled()) return;

  const level = FAILURE_EVENTS.has(name as DashboardEventName) ? 'warning' : 'info';
  Sentry.addBreadcrumb({
    category: 'analytics',
    message: name,
    data: props,
    level,
  });

  if (FAILURE_EVENTS.has(name as DashboardEventName)) {
    Sentry.captureMessage(`analytics:${name}`, { level: 'warning', extra: props });
  }
}

export function trackUiActionFailure(
  action: string,
  properties?: DashboardEventProps,
): void {
  trackDashboardEvent(DASHBOARD_EVENTS.UI_ACTION_FAILED, { action, ...properties });
}

export function setAnalyticsUser(params: {
  id: string;
  tenantId?: string;
  role?: string;
} | null): void {
  if (!isSentryEnabled()) return;
  if (!params) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: params.id,
    tenant_id: params.tenantId,
    role: params.role,
  });
}

export function reportErrorToSentry(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    if (context) scope.setContext('dashboard_error', context);
    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    Sentry.captureMessage(String(error), 'error');
  });
}
