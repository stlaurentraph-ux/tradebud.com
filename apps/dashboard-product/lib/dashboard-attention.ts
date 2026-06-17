import {
  getDashboardAttentionCopy,
  getDashboardAttentionOwnedBlockingMessage,
  getDashboardAttentionUpstreamBlockersMessage,
  getDashboardAttentionYieldFailuresMessage,
} from '@/lib/dashboard-attention-copy';
import type { TenantRole } from '@/types';
import { SETTINGS_LICENSE_PATH } from '@/lib/settings-paths';

type TranslateFn = (key: string) => string;

export type AttentionSeverity = 'blocking' | 'warning' | 'info';

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface DashboardAttentionInput {
  t?: TranslateFn;
  role?: TenantRole;
  ownedBlockingIssuesCount?: number;
  upstreamBlockersCount?: number;
  yieldFailuresCount?: number;
  trialLifecycleStatus?: 'trial_active' | 'trial_expired' | 'paid_active' | 'suspended' | null;
  trialExpiresAt?: string | null;
  summaryError?: string | null;
  onboardingStep?: {
    title: string;
    ctaLabel: string;
    href: string;
  } | null;
}

const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  blocking: 0,
  warning: 1,
  info: 2,
};

export function buildDashboardAttentionItems(input: DashboardAttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { t } = input;
  const ownedBlocking = input.ownedBlockingIssuesCount ?? 0;
  const upstreamBlockers = input.upstreamBlockersCount ?? 0;
  const yieldFailures = input.yieldFailuresCount ?? 0;

  if (ownedBlocking > 0) {
    items.push({
      id: 'owned-blocking-issues',
      severity: 'blocking',
      title: getDashboardAttentionCopy('owned_blocking_title', t),
      message: getDashboardAttentionOwnedBlockingMessage(ownedBlocking, t),
      ctaLabel: getDashboardAttentionCopy('owned_blocking_cta', t),
      ctaHref: '/compliance/issues?ownership=owned',
    });
  }

  if (upstreamBlockers > 0) {
    const roleHint =
      input.role === 'importer'
        ? getDashboardAttentionCopy('upstream_blockers_role_hint_importer', t)
        : getDashboardAttentionCopy('upstream_blockers_role_hint_default', t);
    items.push({
      id: 'upstream-blockers',
      severity: 'blocking',
      title: getDashboardAttentionCopy('upstream_blockers_title', t),
      message: getDashboardAttentionUpstreamBlockersMessage(upstreamBlockers, roleHint, t),
      ctaLabel: getDashboardAttentionCopy('upstream_blockers_cta', t),
      ctaHref: '/compliance/issues?ownership=upstream_blocker',
    });
  }

  if (yieldFailures > 0) {
    items.push({
      id: 'yield-failures',
      severity: 'warning',
      title: getDashboardAttentionCopy('yield_failures_title', t),
      message: getDashboardAttentionYieldFailuresMessage(yieldFailures, t),
      ctaLabel: getDashboardAttentionCopy('yield_failures_cta', t),
      ctaHref: '/harvests',
    });
  }

  if (input.trialLifecycleStatus === 'suspended') {
    items.push({
      id: 'account-suspended',
      severity: 'blocking',
      title: getDashboardAttentionCopy('account_suspended_title', t),
      message: getDashboardAttentionCopy('account_suspended_message', t),
      ctaLabel: getDashboardAttentionCopy('account_suspended_cta', t),
      ctaHref: SETTINGS_LICENSE_PATH,
    });
  }

  if (input.trialLifecycleStatus === 'trial_expired') {
    items.push({
      id: 'trial-expired',
      severity: 'warning',
      title: getDashboardAttentionCopy('trial_expired_title', t),
      message: getDashboardAttentionCopy('trial_expired_message', t),
      ctaLabel: getDashboardAttentionCopy('trial_expired_cta', t),
      ctaHref: SETTINGS_LICENSE_PATH,
    });
  }

  if (input.summaryError) {
    items.push({
      id: 'summary-error',
      severity: 'warning',
      title: getDashboardAttentionCopy('summary_error_title', t),
      message: getDashboardAttentionCopy('summary_error_message', t),
    });
  }

  if (input.onboardingStep && !hasBlockingAttention(items)) {
    items.push({
      id: 'onboarding-next-step',
      severity: 'info',
      title: input.onboardingStep.title,
      message: getDashboardAttentionCopy('onboarding_next_step_message', t),
      ctaLabel: input.onboardingStep.ctaLabel,
      ctaHref: input.onboardingStep.href,
    });
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function hasBlockingAttention(items: AttentionItem[]): boolean {
  return items.some((item) => item.severity === 'blocking');
}
