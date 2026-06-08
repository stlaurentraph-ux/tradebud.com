// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { InboxFulfillmentDialog } from '@/components/inbox/inbox-fulfillment-dialog';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { tenant_id: 'tenant_exporter', active_role: 'exporter' },
  }),
}));

const sampleRequest = {
  id: 'req_1',
  campaign_id: 'camp_1',
  title: 'Upload FPIC',
  request_type: 'CONSENT_GRANT' as const,
  due_at: '2026-05-01T00:00:00.000Z',
  from_org: 'Importer Org',
  sender_tenant_id: 'tenant_importer',
  recipient_tenant_id: 'tenant_exporter',
  status: 'PENDING' as const,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};

describe('InboxFulfillmentDialog', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes('/api/plots')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: 'plot_117', name: 'Nyota Block A', status: 'verified' }],
          } as Response);
        }
        if (url.includes('/api/requests/evidence-feed')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                id: 'evidence_1',
                name: 'Member Consent Renewal',
                type: 'consent_form',
                farmer_or_community: 'Amina N.',
                plot_id: 'plot_117',
                upload_date: '2026-04-18T11:00:00.000Z',
                expiry_date: '2027-04-18T00:00:00.000Z',
                status: 'verified',
              },
            ],
          } as Response);
        }
        if (url.includes('/api/harvest/packages')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ packages: [] }),
          } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }),
    );
    sessionStorage.setItem('tracebud_token', 'demo_token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders plot and evidence pickers from backend feeds', async () => {
    render(
      <InboxFulfillmentDialog
        request={sampleRequest}
        open
        onOpenChange={() => undefined}
        onSubmit={async () => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Nyota Block A')).toBeInTheDocument();
    });
    expect(screen.getByText('Member Consent Renewal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open evidence repository' })).toHaveAttribute('href', '/fpic');
  });
});
