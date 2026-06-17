import { describe, expect, it } from 'vitest';
import { buildDashboardAttentionItems, hasBlockingAttention } from './dashboard-attention';

describe('buildDashboardAttentionItems', () => {
  it('prioritizes owned blocking issues first', () => {
    const items = buildDashboardAttentionItems({
      ownedBlockingIssuesCount: 2,
      upstreamBlockersCount: 1,
      yieldFailuresCount: 1,
    });
    expect(items[0]?.id).toBe('owned-blocking-issues');
    expect(hasBlockingAttention(items)).toBe(true);
  });

  it('includes upstream blockers with importer-specific hint', () => {
    const items = buildDashboardAttentionItems({
      role: 'importer',
      upstreamBlockersCount: 3,
    });
    expect(items[0]?.message).toContain('EU filing readiness');
  });

  it('omits onboarding step when blockers exist', () => {
    const items = buildDashboardAttentionItems({
      ownedBlockingIssuesCount: 1,
      onboardingStep: {
        title: 'Add producers',
        ctaLabel: 'Open farmers',
        href: '/farmers',
      },
    });
    expect(items.some((item) => item.id === 'onboarding-next-step')).toBe(false);
  });

  it('includes onboarding step when no blockers', () => {
    const items = buildDashboardAttentionItems({
      onboardingStep: {
        title: 'Add producers',
        ctaLabel: 'Open farmers',
        href: '/farmers',
      },
    });
    expect(items.some((item) => item.id === 'onboarding-next-step')).toBe(true);
  });

  it('surfaces expired trial and suspension lifecycle in the attention strip', () => {
    const trialItems = buildDashboardAttentionItems({
      trialLifecycleStatus: 'trial_active',
      trialExpiresAt: '2026-12-31T00:00:00.000Z',
    });
    expect(trialItems.some((item) => item.id === 'trial-active')).toBe(false);

    const expiredItems = buildDashboardAttentionItems({
      trialLifecycleStatus: 'trial_expired',
    });
    expect(expiredItems.some((item) => item.id === 'trial-expired')).toBe(true);

    const suspendedItems = buildDashboardAttentionItems({
      trialLifecycleStatus: 'suspended',
    });
    expect(suspendedItems[0]?.id).toBe('account-suspended');
  });
});
