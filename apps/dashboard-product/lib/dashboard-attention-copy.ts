import type { AttentionSeverity } from '@/lib/dashboard-attention';

type TranslateFn = (key: string) => string;

function wf(
  key: string,
  fallback: string,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  if (!t) {
    const text = fallback;
    if (!values) return text;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
      text,
    );
  }
  const resolved = t(key);
  const text = resolved === key ? fallback : resolved;
  if (!values) return text;
  return Object.entries(values).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    text,
  );
}

function pluralLine(
  count: number,
  oneKey: string,
  oneFallback: string,
  otherKey: string,
  otherFallback: string,
  t?: TranslateFn,
): string {
  if (count === 1) {
    return wf(oneKey, oneFallback, t);
  }
  return wf(otherKey, otherFallback, t, { count });
}

export const DASHBOARD_ATTENTION_COPY = {
  owned_blocking_title: {
    key: 'workflow.dashboard.attention.owned_blocking.title',
    fallback: 'Blocking issues need your action',
  },
  owned_blocking_message_one: {
    key: 'workflow.dashboard.attention.owned_blocking.message_one',
    fallback: '1 issue you own must be resolved before shipments can progress.',
  },
  owned_blocking_message_other: {
    key: 'workflow.dashboard.attention.owned_blocking.message_other',
    fallback: '{{count}} issues you own must be resolved before shipments can progress.',
  },
  owned_blocking_cta: {
    key: 'workflow.dashboard.attention.owned_blocking.cta',
    fallback: 'Review owned issues',
  },
  upstream_blockers_title: {
    key: 'workflow.dashboard.attention.upstream_blockers.title',
    fallback: 'Upstream blockers',
  },
  upstream_blockers_message_one: {
    key: 'workflow.dashboard.attention.upstream_blockers.message_one',
    fallback:
      '1 issue needs remediation by an exporter or cooperative before your shipments can clear.',
  },
  upstream_blockers_message_other: {
    key: 'workflow.dashboard.attention.upstream_blockers.message_other',
    fallback:
      '{{count}} issues need remediation by an exporter or cooperative before your shipments can clear.',
  },
  upstream_blockers_role_hint_importer: {
    key: 'workflow.dashboard.attention.upstream_blockers.role_hint.importer',
    fallback: 'These block shared shipments you depend on for EU filing readiness.',
  },
  upstream_blockers_role_hint_default: {
    key: 'workflow.dashboard.attention.upstream_blockers.role_hint.default',
    fallback: 'These affect shared shipments in your network.',
  },
  upstream_blockers_cta: {
    key: 'workflow.dashboard.attention.upstream_blockers.cta',
    fallback: 'View upstream blockers',
  },
  yield_failures_title: {
    key: 'workflow.dashboard.attention.yield_failures.title',
    fallback: 'Yield exceptions pending',
  },
  yield_failures_message_one: {
    key: 'workflow.dashboard.attention.yield_failures.message_one',
    fallback: '1 batch failed yield plausibility and needs exception handling.',
  },
  yield_failures_message_other: {
    key: 'workflow.dashboard.attention.yield_failures.message_other',
    fallback: '{{count}} batches failed yield plausibility and need exception handling.',
  },
  yield_failures_cta: {
    key: 'workflow.dashboard.attention.yield_failures.cta',
    fallback: 'View lots & batches',
  },
  account_suspended_title: {
    key: 'workflow.dashboard.attention.account_suspended.title',
    fallback: 'Account suspended',
  },
  account_suspended_message: {
    key: 'workflow.dashboard.attention.account_suspended.message',
    fallback: 'Your workspace is suspended. Contact support or review your subscription to restore access.',
  },
  account_suspended_cta: {
    key: 'workflow.dashboard.attention.account_suspended.cta',
    fallback: 'Manage subscription',
  },
  trial_active_title: {
    key: 'workflow.dashboard.attention.trial_active.title',
    fallback: 'Trial access active',
  },
  trial_active_message_with_expiry: {
    key: 'workflow.dashboard.attention.trial_active.message_with_expiry',
    fallback: 'Trial ends {{date}}. Upgrade before expiry to keep premium workflows.',
  },
  trial_active_message_no_expiry: {
    key: 'workflow.dashboard.attention.trial_active.message_no_expiry',
    fallback: 'Trial access is active. Upgrade before expiry to keep premium workflows.',
  },
  trial_active_cta: {
    key: 'workflow.dashboard.attention.trial_active.cta',
    fallback: 'Manage subscription',
  },
  trial_expired_title: {
    key: 'workflow.dashboard.attention.trial_expired.title',
    fallback: 'Trial expired',
  },
  trial_expired_message: {
    key: 'workflow.dashboard.attention.trial_expired.message',
    fallback: 'Upgrade is required to continue premium workflows.',
  },
  trial_expired_cta: {
    key: 'workflow.dashboard.attention.trial_expired.cta',
    fallback: 'Manage subscription',
  },
  summary_error_title: {
    key: 'workflow.dashboard.attention.summary_error.title',
    fallback: 'Metrics temporarily unavailable',
  },
  summary_error_message: {
    key: 'workflow.dashboard.attention.summary_error.message',
    fallback: 'Dashboard metrics could not be loaded. Showing partial data.',
  },
  onboarding_next_step_message: {
    key: 'workflow.dashboard.attention.onboarding_next_step.message',
    fallback: 'Continue onboarding to unlock your full workspace.',
  },
  severity_blocking: {
    key: 'workflow.dashboard.attention.severity.blocking',
    fallback: 'blocking',
  },
  severity_warning: {
    key: 'workflow.dashboard.attention.severity.warning',
    fallback: 'warning',
  },
  severity_info: {
    key: 'workflow.dashboard.attention.severity.info',
    fallback: 'info',
  },
  region_aria: {
    key: 'workflow.dashboard.attention.region_aria',
    fallback: 'Attention required',
  },
  open_fallback: {
    key: 'workflow.dashboard.attention.open_fallback',
    fallback: 'Open',
  },
} as const;

export function getDashboardAttentionCopy(
  field: keyof typeof DASHBOARD_ATTENTION_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = DASHBOARD_ATTENTION_COPY[field];
  return wf(entry.key, entry.fallback, t, values);
}

export function getDashboardAttentionOwnedBlockingMessage(count: number, t?: TranslateFn): string {
  return pluralLine(
    count,
    DASHBOARD_ATTENTION_COPY.owned_blocking_message_one.key,
    DASHBOARD_ATTENTION_COPY.owned_blocking_message_one.fallback,
    DASHBOARD_ATTENTION_COPY.owned_blocking_message_other.key,
    DASHBOARD_ATTENTION_COPY.owned_blocking_message_other.fallback,
    t,
  );
}

export function getDashboardAttentionUpstreamBlockersMessage(
  count: number,
  roleHint: string,
  t?: TranslateFn,
): string {
  const countMessage = pluralLine(
    count,
    DASHBOARD_ATTENTION_COPY.upstream_blockers_message_one.key,
    DASHBOARD_ATTENTION_COPY.upstream_blockers_message_one.fallback,
    DASHBOARD_ATTENTION_COPY.upstream_blockers_message_other.key,
    DASHBOARD_ATTENTION_COPY.upstream_blockers_message_other.fallback,
    t,
  );
  return `${countMessage} ${roleHint}`;
}

export function getDashboardAttentionYieldFailuresMessage(count: number, t?: TranslateFn): string {
  return pluralLine(
    count,
    DASHBOARD_ATTENTION_COPY.yield_failures_message_one.key,
    DASHBOARD_ATTENTION_COPY.yield_failures_message_one.fallback,
    DASHBOARD_ATTENTION_COPY.yield_failures_message_other.key,
    DASHBOARD_ATTENTION_COPY.yield_failures_message_other.fallback,
    t,
  );
}

export function getDashboardAttentionTrialActiveMessage(
  trialExpiresAt: string | null | undefined,
  t?: TranslateFn,
): string {
  if (trialExpiresAt) {
    return getDashboardAttentionCopy('trial_active_message_with_expiry', t, {
      date: new Date(trialExpiresAt).toLocaleDateString(),
    });
  }
  return getDashboardAttentionCopy('trial_active_message_no_expiry', t);
}

export function getDashboardAttentionSeverityLabel(
  severity: AttentionSeverity,
  t?: TranslateFn,
): string {
  const field =
    severity === 'blocking'
      ? 'severity_blocking'
      : severity === 'warning'
        ? 'severity_warning'
        : 'severity_info';
  return getDashboardAttentionCopy(field, t);
}

export function getDashboardAttentionCopyManifest(): Record<string, string> {
  return Object.fromEntries(
    Object.values(DASHBOARD_ATTENTION_COPY).map((entry) => [entry.key, entry.fallback]),
  );
}
