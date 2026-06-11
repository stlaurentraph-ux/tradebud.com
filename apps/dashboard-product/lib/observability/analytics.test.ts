import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
}));

const trackMock = vi.hoisted(() => vi.fn());

vi.mock('@vercel/analytics', () => ({
  track: trackMock,
}));

vi.mock('@sentry/nextjs', () => sentryMocks);

vi.mock('@/lib/observability/sentry-options', () => ({
  isSentryEnabled: () => true,
}));

import { DASHBOARD_EVENTS, trackDashboardEvent, trackUiActionFailure } from './analytics';

describe('dashboard analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends events to Vercel Analytics and Sentry breadcrumbs', () => {
    trackDashboardEvent(DASHBOARD_EVENTS.PACKAGE_CREATE_SUCCESS, {
      packageId: 'pkg-1',
      voucherCount: 2,
    });

    expect(trackMock).toHaveBeenCalledWith(DASHBOARD_EVENTS.PACKAGE_CREATE_SUCCESS, {
      packageId: 'pkg-1',
      voucherCount: 2,
    });
    expect(sentryMocks.addBreadcrumb).toHaveBeenCalled();
    expect(sentryMocks.captureMessage).not.toHaveBeenCalled();
  });

  it('escalates failure events to Sentry messages', () => {
    trackDashboardEvent(DASHBOARD_EVENTS.SIGN_IN_FAILURE, { reason: 'invalid_credentials' });

    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      `analytics:${DASHBOARD_EVENTS.SIGN_IN_FAILURE}`,
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('wraps ui action failures with action name', () => {
    trackUiActionFailure('package_create', { reason: 'validation' });

    expect(trackMock).toHaveBeenCalledWith(
      DASHBOARD_EVENTS.UI_ACTION_FAILED,
      expect.objectContaining({ action: 'package_create', reason: 'validation' }),
    );
  });
});
