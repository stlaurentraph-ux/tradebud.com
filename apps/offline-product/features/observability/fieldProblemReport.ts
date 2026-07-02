import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { getOfflineRuntimeBuildDisplay } from '@/features/auth/offlineRuntimeBuild';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  captureFieldProblemFeedback,
  isSentryEnabled,
} from '@/features/observability/sentryClient';
import { sanitizeAnalyticsProperties } from '@/features/security/sanitizeLogContext';
import { loadPendingSyncActions, type PendingSyncAction } from '@/features/state/persistence';
import { classifyQueueSyncFailure } from '@/features/sync/syncFailure';

export type FieldProblemReportContext = Record<string, string | number | boolean>;

export type CollectFieldProblemReportContextInput = {
  bootError?: boolean;
  queuePendingCount?: number;
  queueLastError?: string | null;
  queueLastErrorActionType?: PendingSyncAction['actionType'] | null;
};

function latestQueueError(rows: PendingSyncAction[]): {
  lastError: string | null;
  actionType: PendingSyncAction['actionType'] | null;
} {
  const latestErrored = [...rows]
    .sort((a, b) => {
      if ((b.attempts ?? 0) !== (a.attempts ?? 0)) return (b.attempts ?? 0) - (a.attempts ?? 0);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    })
    .find((row) => typeof row.lastError === 'string' && row.lastError.trim().length > 0);

  return {
    lastError: latestErrored?.lastError?.trim() ?? null,
    actionType: latestErrored?.actionType ?? null,
  };
}

/** Sanitized device + sync snapshot for farmer problem reports (no PII). */
export async function collectFieldProblemReportContext(
  input: CollectFieldProblemReportContextInput = {},
): Promise<FieldProblemReportContext> {
  const build = getOfflineRuntimeBuildDisplay();
  const rows = await loadPendingSyncActions().catch(() => []);
  const queueError = latestQueueError(rows);
  const lastError = input.queueLastError ?? queueError.lastError;
  const actionType = input.queueLastErrorActionType ?? queueError.actionType;

  let syncCause = 'none';
  let syncStep = 'none';
  if (lastError) {
    const classified = classifyQueueSyncFailure({ error: lastError, actionType: actionType ?? undefined });
    syncCause = classified.cause;
    syncStep = classified.step;
  }

  const raw: Record<string, unknown> = {
    platform: Platform.OS,
    signed_in: hasSyncAuthSession(),
    boot_error: input.bootError === true,
    app_version: build.appVersion,
    build_kind: build.kind,
    build_detail: build.detail,
    sentry_environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'unknown',
    ota_channel: Updates.channel ?? 'embedded',
    ota_update_id: Updates.updateId ?? 'embedded',
    runtime_version:
      Constants.expoConfig?.runtimeVersion ??
      (typeof Constants.expoConfig?.extra?.runtimeVersion === 'string'
        ? Constants.expoConfig.extra.runtimeVersion
        : 'unknown'),
    queue_pending_count: input.queuePendingCount ?? rows.length,
    sync_last_cause: syncCause,
    sync_last_step: syncStep,
  };

  if (actionType) {
    raw.queue_last_action_type = actionType;
  }

  const safe = sanitizeAnalyticsProperties(raw);
  const out: FieldProblemReportContext = {};
  if (!safe) return out;

  for (const [key, value] of Object.entries(safe)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else if (value != null) {
      out[key] = String(value);
    }
  }
  return out;
}

export function formatFieldProblemReportMessage(
  userNote: string,
  context: FieldProblemReportContext,
  eventId?: string,
): string {
  const note = userNote.trim() || '(no description provided)';
  const lines = [note, '', '--- diagnostics (sanitized) ---'];
  for (const [key, value] of Object.entries(context)) {
    lines.push(`${key}=${value}`);
  }
  if (eventId) {
    lines.push(`sentry_event_id=${eventId}`);
  }
  return lines.join('\n');
}

export type SubmitFieldProblemReportResult =
  | { ok: true; usedSentry: true; eventId: string }
  | { ok: true; usedSentry: false; mailtoUrl: string }
  | { ok: false; reason: 'sentry_failed' };

export async function submitFieldProblemReport(params: {
  userNote: string;
  context: FieldProblemReportContext;
}): Promise<SubmitFieldProblemReportResult> {
  const message = formatFieldProblemReportMessage(params.userNote, params.context);

  if (!isSentryEnabled()) {
    const subject = encodeURIComponent('Tracebud field app — problem report');
    const body = encodeURIComponent(message);
    return {
      ok: true,
      usedSentry: false,
      mailtoUrl: `mailto:support@tracebud.com?subject=${subject}&body=${body}`,
    };
  }

  const eventId = captureFieldProblemFeedback({ message, context: params.context });
  if (!eventId) {
    trackEvent(ANALYTICS_EVENTS.FIELD_PROBLEM_REPORT_FAILED, { reason: 'no_event_id' });
    return { ok: false, reason: 'sentry_failed' };
  }

  trackEvent(ANALYTICS_EVENTS.FIELD_PROBLEM_REPORT_SUBMITTED, {
    has_note: params.userNote.trim().length > 0,
  });

  return { ok: true, usedSentry: true, eventId };
}
