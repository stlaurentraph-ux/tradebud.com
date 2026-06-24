import {
  buildCampaignRecipientTimeline,
  deriveCampaignRecipientOnboardingStatus,
} from './campaign-recipient-timeline';

describe('campaign-recipient-timeline', () => {
  it('derives fulfilled when accept decision came from inbox fulfillment', () => {
    expect(
      deriveCampaignRecipientOnboardingStatus(
        { recipient_email: 'a@example.com', status: 'claimed', claimed_tenant_id: 't1', sent_at: null },
        {
          recipient_email: 'a@example.com',
          decision: 'accept',
          source: 'inbox_fulfillment',
          decided_at: '2026-04-22T12:00:00.000Z',
        },
      ),
    ).toBe('fulfilled');
  });

  it('derives signed_up when invite is claimed without a decision', () => {
    expect(
      deriveCampaignRecipientOnboardingStatus(
        {
          recipient_email: 'a@example.com',
          status: 'claimed',
          claimed_tenant_id: 'tenant_1',
          sent_at: '2026-04-22T10:00:00.000Z',
        },
        null,
      ),
    ).toBe('signed_up');
  });

  it('derives invite_sent when invite is pending or sent', () => {
    expect(
      deriveCampaignRecipientOnboardingStatus(
        { recipient_email: 'a@example.com', status: 'sent', claimed_tenant_id: null, sent_at: null },
        null,
      ),
    ).toBe('invite_sent');
  });

  it('derives on_platform when no invite row exists', () => {
    expect(deriveCampaignRecipientOnboardingStatus(null, null)).toBe('on_platform');
  });

  it('builds recipient timeline with status counts', () => {
    const result = buildCampaignRecipientTimeline({
      targetEmails: ['invite@example.com', 'existing@example.com', 'done@example.com'],
      invites: [
        {
          recipient_email: 'invite@example.com',
          status: 'sent',
          claimed_tenant_id: null,
          sent_at: '2026-04-22T09:00:00.000Z',
        },
        {
          recipient_email: 'signed@example.com',
          status: 'claimed',
          claimed_tenant_id: 'tenant_2',
          sent_at: '2026-04-22T08:00:00.000Z',
        },
      ],
      decisions: [
        {
          recipient_email: 'done@example.com',
          decision: 'accept',
          source: 'inbox_fulfillment',
          decided_at: '2026-04-22T12:00:00.000Z',
        },
        {
          recipient_email: 'refused@example.com',
          decision: 'refuse',
          source: 'email_cta',
          decided_at: '2026-04-22T11:00:00.000Z',
        },
      ],
    });

    expect(result.recipients.map((row) => [row.recipient_email, row.onboarding_status])).toEqual([
      ['done@example.com', 'fulfilled'],
      ['existing@example.com', 'on_platform'],
      ['invite@example.com', 'invite_sent'],
      ['refused@example.com', 'refused'],
      ['signed@example.com', 'signed_up'],
    ]);
    expect(result.status_counts).toEqual({
      fulfilled: 1,
      accepted: 0,
      refused: 1,
      signed_up: 1,
      invite_sent: 1,
      on_platform: 1,
    });
  });
});
