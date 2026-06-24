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
  DELIVERY_QR_PREVIEW_VIEWED: 'delivery_qr_preview_viewed',
  DELIVERY_DESK_SCAN_STARTED: 'delivery_desk_scan_started',
  DELIVERY_DESK_SCAN_SUCCESS: 'delivery_desk_scan_success',
  DELIVERY_DESK_CLAIM_SUCCESS: 'delivery_desk_claim_success',
  DELIVERY_DESK_CLAIM_FAILURE: 'delivery_desk_claim_failure',
  DELIVERY_DESK_AUTO_CLAIM: 'delivery_desk_auto_claim',
  DELIVERY_DESK_TRIP_CLAIM_SUCCESS: 'delivery_desk_trip_claim_success',
  DELIVERY_DESK_HANDOFF_CONFIRMED: 'delivery_desk_handoff_confirmed',
  DELIVERY_TRIP_PREVIEW_VIEWED: 'delivery_trip_preview_viewed',
} as const;

export type DashboardEventName = (typeof DASHBOARD_EVENTS)[keyof typeof DASHBOARD_EVENTS];

type DashboardEventProps = Record<string, string | number | boolean | undefined>;

const FAILURE_EVENTS = new Set<DashboardEventName>([
  DASHBOARD_EVENTS.SIGN_IN_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_CREATE_FAILURE,
  DASHBOARD_EVENTS.PACKAGE_SEAL_FAILURE,
  DASHBOARD_EVENTS.UI_ACTION_FAILED,
  DASHBOARD_EVENTS.REACT_RENDER_ERROR,
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
