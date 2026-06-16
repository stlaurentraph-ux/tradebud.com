import type { TenantRole } from '@/types';

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
  const ownedBlocking = input.ownedBlockingIssuesCount ?? 0;
  const upstreamBlockers = input.upstreamBlockersCount ?? 0;
  const yieldFailures = input.yieldFailuresCount ?? 0;

  if (ownedBlocking > 0) {
    items.push({
      id: 'owned-blocking-issues',
      severity: 'blocking',
      title: 'Blocking issues need your action',
      message: `${ownedBlocking} issue${ownedBlocking === 1 ? '' : 's'} you own must be resolved before shipments can progress.`,
      ctaLabel: 'Review owned issues',
      ctaHref: '/compliance/issues?ownership=owned',
    });
  }

  if (upstreamBlockers > 0) {
    const roleHint =
      input.role === 'importer'
        ? 'These block shared shipments you depend on for EU filing readiness.'
        : 'These affect shared shipments in your network.';
    items.push({
      id: 'upstream-blockers',
      severity: 'blocking',
      title: 'Upstream blockers',
      message: `${upstreamBlockers} issue${upstreamBlockers === 1 ? '' : 's'} need remediation by an exporter or cooperative before your shipments can clear. ${roleHint}`,
      ctaLabel: 'View upstream blockers',
      ctaHref: '/compliance/issues?ownership=upstream_blocker',
    });
  }

  if (yieldFailures > 0) {
    items.push({
      id: 'yield-failures',
      severity: 'warning',
      title: 'Yield exceptions pending',
      message: `${yieldFailures} batch${yieldFailures === 1 ? '' : 'es'} failed yield plausibility and need exception handling.`,
      ctaLabel: 'View lots & batches',
      ctaHref: '/harvests',
    });
  }

  if (input.trialLifecycleStatus === 'suspended') {
    items.push({
      id: 'account-suspended',
      severity: 'blocking',
      title: 'Account suspended',
      message: 'Your workspace is suspended. Contact support or review billing to restore access.',
      ctaLabel: 'Open billing',
      ctaHref: '/settings/billing',
    });
  }

  if (input.trialLifecycleStatus === 'trial_active') {
    const expiryLabel = input.trialExpiresAt
      ? `Trial ends ${new Date(input.trialExpiresAt).toLocaleDateString()}.`
      : 'Trial access is active.';
    items.push({
      id: 'trial-active',
      severity: 'info',
      title: 'Trial access active',
      message: `${expiryLabel} Upgrade before expiry to keep premium workflows.`,
      ctaLabel: 'View billing',
      ctaHref: '/settings/billing',
    });
  }

  if (input.trialLifecycleStatus === 'trial_expired') {
    items.push({
      id: 'trial-expired',
      severity: 'warning',
      title: 'Trial expired',
      message: 'Upgrade is required to continue premium workflows.',
      ctaLabel: 'Open billing',
      ctaHref: '/settings/billing',
    });
  }

  if (input.summaryError) {
    items.push({
      id: 'summary-error',
      severity: 'warning',
      title: 'Metrics temporarily unavailable',
      message: 'Dashboard metrics could not be loaded. Showing partial data.',
    });
  }

  if (input.onboardingStep && !hasBlockingAttention(items)) {
    items.push({
      id: 'onboarding-next-step',
      severity: 'info',
      title: input.onboardingStep.title,
      message: 'Continue onboarding to unlock your full workspace.',
      ctaLabel: input.onboardingStep.ctaLabel,
      ctaHref: input.onboardingStep.href,
    });
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function hasBlockingAttention(items: AttentionItem[]): boolean {
  return items.some((item) => item.severity === 'blocking');
}
