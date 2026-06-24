// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CampaignDecisionsDialog } from '@/components/requests/campaign-decisions-dialog';

vi.mock('@/components/common/permission-gate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => children,
}));

const basePayload = {
  campaign_id: 'camp_1',
  tenant_id: 'tenant_1',
  last_synced_at: '2026-04-22T12:00:00.000Z',
  counts: { all: 2, accept: 1, refuse: 1 },
  recipient_status_counts: {
    fulfilled: 1,
    accepted: 0,
    refused: 1,
    signed_up: 0,
    invite_sent: 1,
    on_platform: 0,
  },
  pagination: {
    decision: 'all' as const,
    limit: 20,
    offset: 0,
    returned: 2,
    has_more: false,
  },
  recipients: [
    {
      recipient_email: 'accept@example.com',
      onboarding_status: 'fulfilled' as const,
      invite_status: null,
      decision: 'accept' as const,
      decision_source: 'inbox_fulfillment',
      fulfillment_source: 'cooperative_on_behalf' as const,
      decided_at: '2026-04-22T12:00:00.000Z',
      updated_at: '2026-04-22T12:00:00.000Z',
    },
    {
      recipient_email: 'refuse@example.com',
      onboarding_status: 'refused' as const,
      invite_status: null,
      decision: 'refuse' as const,
      decision_source: 'email_cta',
      fulfillment_source: null,
      decided_at: '2026-04-22T11:00:00.000Z',
      updated_at: '2026-04-22T11:00:00.000Z',
    },
    {
      recipient_email: 'pending@example.com',
      onboarding_status: 'invite_sent' as const,
      invite_status: 'queued',
      decision: null,
      decision_source: null,
      fulfillment_source: null,
      decided_at: null,
      updated_at: '2026-04-22T10:00:00.000Z',
      delivery_channel: 'email',
      share_links: {
        recipient_lane: 'dashboard' as const,
        connect_url: 'https://dashboard.tracebud.com/create-account?campaign=camp_1',
        inbox_url: 'https://dashboard.tracebud.com/inbox?campaign=camp_1',
      },
      can_resend_invite: true,
    },
  ],
  decisions: [
    {
      campaign_id: 'camp_1',
      recipient_email: 'accept@example.com',
      decision: 'accept' as const,
      decided_at: '2026-04-22T12:00:00.000Z',
      source: 'inbox_fulfillment',
    },
    {
      campaign_id: 'camp_1',
      recipient_email: 'refuse@example.com',
      decision: 'refuse' as const,
      decided_at: '2026-04-22T11:00:00.000Z',
      source: 'email_cta',
    },
  ],
};

describe('CampaignDecisionsDialog', () => {
  const originalFetch = global.fetch;
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => basePayload,
      } as Response),
    );
    Object.assign(navigator, {
      clipboard: { writeText },
    });
    sessionStorage.setItem('tracebud_token', 'demo_token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders funnel summary and recipient progress rows when opened', async () => {
    render(
      <CampaignDecisionsDialog
        campaignId="camp_1"
        campaignTitle="Q1 evidence campaign"
        open
        onOpenChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('1 of 3 fulfilled')).toBeInTheDocument();
    });
    expect(screen.getByText('accept@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Fulfilled').length).toBeGreaterThan(0);
    expect(screen.getByText('Submitted on behalf of farmer')).toBeInTheDocument();
    expect(screen.getAllByText('Refused').length).toBeGreaterThan(0);
  });

  it('shows sender actions for pending recipients', async () => {
    render(
      <CampaignDecisionsDialog
        campaignId="camp_1"
        campaignTitle="Q1 evidence campaign"
        open
        onOpenChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /copy signup link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy inbox link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend invite/i })).toBeInTheDocument();
  });

  it('shows activity log with decision counts when tab is selected', async () => {
    const user = userEvent.setup();

    render(
      <CampaignDecisionsDialog
        campaignId="camp_1"
        campaignTitle="Q1 evidence campaign"
        open
        onOpenChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('accept@example.com')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /activity/i }));

    expect(screen.getByRole('tab', { name: /^all/i })).toHaveTextContent('2');
    expect(screen.getByRole('tab', { name: /accept/i })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /refuse/i })).toHaveTextContent('1');
    expect(screen.getAllByText('Inbox fulfillment').length).toBeGreaterThan(0);
    expect(screen.getByText('Email link')).toBeInTheDocument();
  });
});
