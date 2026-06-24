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
  BULK_PLOT_IMPORT_PREVIEW: 'dashboard_bulk_plot_import_preview',
  BULK_PLOT_IMPORT_SUCCESS: 'dashboard_bulk_plot_import_success',
  BULK_PLOT_IMPORT_FAILURE: 'dashboard_bulk_plot_import_failure',
  BULK_PLOT_IMPORT_JOB_QUEUED: 'dashboard_bulk_plot_import_job_queued',
  BULK_PLOT_IMPORT_JOB_COMPLETED: 'dashboard_bulk_plot_import_job_completed',
  BULK_PLOT_IMPORT_EVIDENCE_SUCCESS: 'dashboard_bulk_plot_import_evidence_success',
  BULK_PLOT_IMPORT_EVIDENCE_FAILURE: 'dashboard_bulk_plot_import_evidence_failure',
  BULK_PLOT_IMPORT_PACKAGE_SIGNATURE_VERIFIED: 'dashboard_bulk_plot_import_package_signature_verified',
  BULK_PLOT_IMPORT_PACKAGE_SIGNATURE_FAILED: 'dashboard_bulk_plot_import_package_signature_failed',
  BULK_PLOT_IMPORT_PACKAGE_UNSIGNED: 'dashboard_bulk_plot_import_package_unsigned',
  INBOUND_CAMPAIGN_REQUEST_VIEWED: 'inbound_campaign_request_viewed',
} as const;

export type DashboardEventName = (typeof DASHBOARD_EVENTS)[keyof typeof DASHBOARD_EVENTS];

type DashboardEventProps = Record<string, string | number | boolean | undefined>;

const FAILURE_EVENTS = new Set<DashboardEventName>([
  DASHBOARD_EVENTS.SIGN_IN_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_CREATE_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_SEAL_FAILURE,
  DASHBOARD_EVENTS.UI_ACTION_FAILED,
  DASHBOARD_EVENTS.REACT_RENDER_ERROR,
  DASHBOARD_EVENTS.BULK_PLOT_IMPORT_FAILURE,
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
