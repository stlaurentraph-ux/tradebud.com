import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  isSentryEnabled: vi.fn(() => true),
  addSentryBreadcrumb: vi.fn(),
  captureAnalyticsSignal: vi.fn(),
  setSentryUser: vi.fn(),
}));

vi.mock('./sentryClient', () => sentryMocks);

import { ANALYTICS_EVENTS, trackEvent, trackUiActionFailure } from './analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentryMocks.isSentryEnabled.mockReturnValue(true);
  });

  it('records success events as breadcrumbs only', () => {
    trackEvent(ANALYTICS_EVENTS.PLOT_CREATED, { plotId: 'p1' });

    expect(sentryMocks.addSentryBreadcrumb).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.PLOT_CREATED,
      { plotId: 'p1' },
      'info',
    );
    expect(sentryMocks.captureAnalyticsSignal).not.toHaveBeenCalled();
  });

  it('escalates failure events to Sentry signals', () => {
    trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE, { plotId: 'p1' });

    expect(sentryMocks.captureAnalyticsSignal).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE,
      { plotId: 'p1' },
      'warning',
    );
  });

  it('no-ops remote reporting when sentry is disabled', () => {
    sentryMocks.isSentryEnabled.mockReturnValue(false);

    trackEvent(ANALYTICS_EVENTS.SESSION_START);

    expect(sentryMocks.addSentryBreadcrumb).not.toHaveBeenCalled();
  });

  it('wraps ui action failures with action name', () => {
    trackUiActionFailure('harvest_record_delivery', { reason: 'validation' });

    expect(sentryMocks.captureAnalyticsSignal).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.UI_ACTION_FAILED,
      { action: 'harvest_record_delivery', reason: 'validation' },
      'warning',
    );
  });
});
