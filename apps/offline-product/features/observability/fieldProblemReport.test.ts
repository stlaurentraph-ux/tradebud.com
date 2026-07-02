import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { runtimeVersion: '1.0.0' },
  },
}));

vi.mock('expo-updates', () => ({
  channel: 'preview',
  updateId: 'update-123',
}));

const persistenceMocks = vi.hoisted(() => ({
  loadPendingSyncActions: vi.fn(),
}));

const sentryMocks = vi.hoisted(() => ({
  isSentryEnabled: vi.fn(() => true),
  captureFieldProblemFeedback: vi.fn(() => 'event-abc'),
}));

const trackEvent = vi.hoisted(() => vi.fn());

vi.mock('@/features/state/persistence', () => persistenceMocks);
vi.mock('@/features/api/syncAuthSession', () => ({
  hasSyncAuthSession: vi.fn(() => true),
}));
vi.mock('@/features/auth/offlineRuntimeBuild', () => ({
  getOfflineRuntimeBuildDisplay: vi.fn(() => ({
    kind: 'ota',
    headlineKey: 'settings_build_kind_ota',
    detail: 'bundle:ota:preview',
    appVersion: '1.0.0',
    showOauthRebuildHint: true,
  })),
}));
vi.mock('@/features/observability/sentryClient', () => sentryMocks);
vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: {
    FIELD_PROBLEM_REPORT_SUBMITTED: 'field_problem_report_submitted',
    FIELD_PROBLEM_REPORT_FAILED: 'field_problem_report_failed',
  },
  trackEvent,
}));

import {
  collectFieldProblemReportContext,
  formatFieldProblemReportMessage,
  submitFieldProblemReport,
} from './fieldProblemReport';

describe('fieldProblemReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentryMocks.isSentryEnabled.mockReturnValue(true);
    persistenceMocks.loadPendingSyncActions.mockResolvedValue([
      {
        id: '1',
        actionType: 'photos_sync',
        attempts: 2,
        lastError: 'Network request failed',
        createdAt: 1,
      },
    ]);
  });

  it('collects sanitized sync context without raw queue error text', async () => {
    const context = await collectFieldProblemReportContext({ bootError: true });
    expect(context.boot_error).toBe(true);
    expect(context.queue_pending_count).toBe(1);
    expect(context.sync_last_step).toBe('photo_api');
    expect(context.sync_last_cause).toBe('network');
    expect(context).not.toHaveProperty('queue_last_error');
  });

  it('formats farmer note with diagnostics block', () => {
    const message = formatFieldProblemReportMessage(
      'Sync stuck',
      { platform: 'ios', queue_pending_count: 2 },
      'event-123',
    );
    expect(message).toContain('Sync stuck');
    expect(message).toContain('platform=ios');
    expect(message).toContain('sentry_event_id=event-123');
  });

  it('submits via Sentry when enabled', async () => {
    const result = await submitFieldProblemReport({
      userNote: 'Cannot sign in',
      context: { platform: 'android' },
    });
    expect(result).toEqual({ ok: true, usedSentry: true, eventId: 'event-abc' });
    expect(sentryMocks.captureFieldProblemFeedback).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('field_problem_report_submitted', { has_note: true });
  });

  it('falls back to mailto when Sentry is disabled', async () => {
    sentryMocks.isSentryEnabled.mockReturnValue(false);
    const result = await submitFieldProblemReport({
      userNote: '',
      context: { platform: 'ios' },
    });
    expect(result.ok).toBe(true);
    if (result.ok && !result.usedSentry) {
      expect(result.mailtoUrl).toContain('mailto:support@tracebud.com');
    }
  });
});
