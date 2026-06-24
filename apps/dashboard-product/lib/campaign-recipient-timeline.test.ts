import {
  campaignRecipientOnboardingBadgeClass,
  computeCampaignFunnelMetrics,
  filterCampaignRecipients,
  formatCampaignRecipientOnboardingStatus,
  getCampaignRecipientDisplayLabel,
  getRecipientProgressSteps,
  summarizeCampaignRecipientStatusCounts,
  type CampaignRecipientStatusCounts,
  type CampaignRecipientTimelineEntry,
} from '@/lib/campaign-recipient-timeline';
import { describe, expect, it } from 'vitest';

describe('campaign-recipient-timeline', () => {
  it('formats onboarding status labels for sender timeline', () => {
    expect(formatCampaignRecipientOnboardingStatus('invite_sent')).toBe('Invite sent');
    expect(formatCampaignRecipientOnboardingStatus('signed_up')).toBe('Joined Tracebud');
    expect(formatCampaignRecipientOnboardingStatus('fulfilled')).toBe('Evidence attached');
  });

  it('summarizes non-zero status counts', () => {
    const counts: CampaignRecipientStatusCounts = {
      fulfilled: 1,
      accepted: 2,
      refused: 0,
      signed_up: 3,
      invite_sent: 4,
      on_platform: 0,
    };

    expect(summarizeCampaignRecipientStatusCounts(counts)).toBe(
      '1 fulfilled · 2 accepted · 3 joined · 4 invite sent',
    );
  });

  it('uses recipient label fallback for desk-only rows', () => {
    expect(
      getCampaignRecipientDisplayLabel({
        recipient_label: '+233555000',
        recipient_email: null,
      }),
    ).toBe('+233555000');
  });

  it('provides badge classes per onboarding status', () => {
    const entry: CampaignRecipientTimelineEntry = {
      recipient_email: 'a@example.com',
      onboarding_status: 'signed_up',
      invite_status: 'claimed',
      decision: null,
      decision_source: null,
      decided_at: null,
      updated_at: '2026-04-22T10:00:00.000Z',
    };

    expect(campaignRecipientOnboardingBadgeClass(entry.onboarding_status)).toContain('sky');
  });

  it('builds progress steps for invite_sent and fulfilled states', () => {
    expect(getRecipientProgressSteps('invite_sent').map((step) => step.state)).toEqual([
      'complete',
      'current',
      'upcoming',
      'upcoming',
    ]);
    expect(getRecipientProgressSteps('fulfilled').every((step) => step.state === 'complete')).toBe(true);
    expect(getRecipientProgressSteps('refused')[2]?.state).toBe('refused');
  });

  it('computes funnel metrics from status counts', () => {
    const metrics = computeCampaignFunnelMetrics(
      {
        fulfilled: 2,
        accepted: 1,
        refused: 1,
        signed_up: 2,
        invite_sent: 3,
        on_platform: 1,
      },
      10,
    );

    expect(metrics).toMatchObject({
      total: 10,
      invited: 10,
      joined: 7,
      responded: 4,
      fulfilled: 2,
      progressPercent: 20,
    });
  });

  it('filters recipients by onboarding filter', () => {
    const recipients: CampaignRecipientTimelineEntry[] = [
      {
        recipient_email: 'a@example.com',
        onboarding_status: 'invite_sent',
        invite_status: 'sent',
        decision: null,
        decision_source: null,
        decided_at: null,
        updated_at: null,
      },
      {
        recipient_email: 'b@example.com',
        onboarding_status: 'fulfilled',
        invite_status: null,
        decision: 'accept',
        decision_source: 'inbox_fulfillment',
        decided_at: '2026-04-22T12:00:00.000Z',
        updated_at: '2026-04-22T12:00:00.000Z',
      },
    ];

    expect(filterCampaignRecipients(recipients, 'fulfilled')).toHaveLength(1);
    expect(filterCampaignRecipients(recipients, 'awaiting_response')).toHaveLength(1);
  });
});
