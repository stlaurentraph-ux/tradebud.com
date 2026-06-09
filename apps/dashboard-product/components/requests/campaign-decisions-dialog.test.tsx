// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CampaignDecisionsDialog } from '@/components/requests/campaign-decisions-dialog';

describe('CampaignDecisionsDialog', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          campaign_id: 'camp_1',
          tenant_id: 'tenant_1',
          last_synced_at: '2026-04-22T12:00:00.000Z',
          counts: { all: 2, accept: 1, refuse: 1 },
          pagination: {
            decision: 'all',
            limit: 20,
            offset: 0,
            returned: 2,
            has_more: false,
          },
          decisions: [
            {
              campaign_id: 'camp_1',
              recipient_email: 'accept@example.com',
              decision: 'accept',
              decided_at: '2026-04-22T12:00:00.000Z',
              source: 'inbox_fulfillment',
            },
            {
              campaign_id: 'camp_1',
              recipient_email: 'refuse@example.com',
              decision: 'refuse',
              decided_at: '2026-04-22T11:00:00.000Z',
              source: 'email_cta',
            },
          ],
        }),
      } as Response),
    );
    sessionStorage.setItem('tracebud_token', 'demo_token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders decision rows when opened', async () => {
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
    expect(screen.getByText('refuse@example.com')).toBeInTheDocument();
    expect(screen.getByText('Inbox fulfillment')).toBeInTheDocument();
    expect(screen.getByText('Email link')).toBeInTheDocument();
  });

  it('shows decision counts on filter tabs', async () => {
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

    expect(screen.getByRole('tab', { name: /all/i })).toHaveTextContent('2');
    expect(screen.getByRole('tab', { name: /accept/i })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /refuse/i })).toHaveTextContent('1');
  });
});
