// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsPage from './page';
import { listContacts } from '@/lib/contact-service';
import { markOnboardingAction } from '@/lib/onboarding-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

vi.mock('@/components/common/permission-gate', () => ({
  PermissionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/contact-service', () => ({
  listContacts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/onboarding-actions', () => ({
  markOnboardingAction: vi.fn(),
}));

describe('RequestsPage bulk target import', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(listContacts).mockResolvedValue([]);
    vi.mocked(markOnboardingAction).mockClear();
  });

  async function fillCampaignAndParseTargets() {
    const user = userEvent.setup();
    render(<RequestsPage />);
    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.type(screen.getByLabelText('Campaign Title'), 'Bulk campaign');
    await user.type(screen.getByLabelText('Due Date'), '2026-05-01');
    await user.type(
      screen.getByLabelText('Bulk targets CSV'),
      'email,full_name,organization\njane@example.com,Jane Doe,Coop A\njohn@example.com,John Doe,Coop B',
    );
    await user.click(screen.getByRole('button', { name: 'Parse targets' }));
    return { user };
  }

  it(
    'parses CSV targets and enables draft creation',
    async () => {
      await fillCampaignAndParseTargets();

      expect(screen.getByText('Parsed 2 unique targets.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Draft' })).toBeEnabled();
    },
    15_000,
  );

  it('shows success banner after successful draft creation', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ campaign_id: 'camp_123' }),
    } as Response);
    const { user } = await fillCampaignAndParseTargets();

    await user.click(screen.getByRole('button', { name: 'Create Draft' }));

    expect(await screen.findByText('Draft campaign created (camp_123).')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    const createCall = fetchSpy.mock.calls.find(
      ([url, init]) => String(url) === '/api/requests/campaigns' && (init as RequestInit)?.method === 'POST',
    );
    expect(createCall).toBeDefined();
    const [url, init] = createCall as [string, RequestInit];
    expect(url).toBe('/api/requests/campaigns');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect((init.headers as Record<string, string>)['X-Idempotency-Key']).toMatch(/^req-campaign-/);
    expect(JSON.parse(String(init.body))).toEqual({
      request_type: 'GENERAL_EVIDENCE',
      campaign_name: 'Bulk campaign',
      description_template: '',
      due_date: '2026-05-01',
      targets: [
        {
          email: 'jane@example.com',
          full_name: 'Jane Doe',
          organization: 'Coop A',
          farmer_id: null,
          plot_id: null,
        },
        {
          email: 'john@example.com',
          full_name: 'John Doe',
          organization: 'Coop B',
          farmer_id: null,
          plot_id: null,
        },
      ],
    });
    expect(vi.mocked(markOnboardingAction)).toHaveBeenCalledWith('campaign_created');
    expect(vi.mocked(markOnboardingAction)).toHaveBeenCalledWith('contacts_uploaded');
  });

  it('shows error banner when draft creation fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Only exporters can create campaigns.' }),
    } as Response);
    const { user } = await fillCampaignAndParseTargets();

    await user.click(screen.getByRole('button', { name: 'Create Draft' }));

    const errors = await screen.findAllByText('Only exporters can create campaigns.');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('excludes malformed CSV rows from outbound targets payload', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ campaign_id: 'camp_456' }),
    } as Response);
    const user = userEvent.setup();
    render(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.type(screen.getByLabelText('Campaign Title'), 'Bulk campaign malformed');
    await user.type(screen.getByLabelText('Due Date'), '2026-05-02');
    await user.type(
      screen.getByLabelText('Bulk targets CSV'),
      [
        'email,full_name,organization',
        'jane@example.com,Jane Doe,Coop A',
        'bad-email,Invalid Person,Coop B',
        ',Missing Email,Coop C',
        'john@example.com,John Doe,Coop D',
      ].join('\n'),
    );
    await user.click(screen.getByRole('button', { name: 'Parse targets' }));

    expect(screen.getByText('Row 3: invalid email "bad-email".')).toBeInTheDocument();
    expect(screen.getByText('Row 4: email and full_name are required.')).toBeInTheDocument();
    expect(screen.getByText('Parsed 2 unique targets.')).toBeInTheDocument();
    expect(screen.getByText('Parse summary: 2 valid / 2 invalid excluded.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Draft' }));

    const createCall = fetchSpy.mock.calls.find(
      ([url, init]) => String(url) === '/api/requests/campaigns' && (init as RequestInit)?.method === 'POST',
    );
    expect(createCall).toBeDefined();
    const [, init] = createCall as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload.targets).toEqual([
      {
        email: 'jane@example.com',
        full_name: 'Jane Doe',
        organization: 'Coop A',
        farmer_id: null,
        plot_id: null,
      },
      {
        email: 'john@example.com',
        full_name: 'John Doe',
        organization: 'Coop D',
        farmer_id: null,
        plot_id: null,
      },
    ]);
  });

  it('downloads CSV template for first-time imports', async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn().mockReturnValue('blob:test-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    const createObjectUrlSpy = vi.mocked(URL.createObjectURL);
    const revokeObjectUrlSpy = vi.mocked(URL.revokeObjectURL);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove');

    render(<RequestsPage />);
    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.click(screen.getByRole('button', { name: 'Download CSV template' }));

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectUrlSpy.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test-url');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });

  it('pastes sample CSV and preloads parsed targets', async () => {
    const user = userEvent.setup();
    render(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.click(screen.getByRole('button', { name: 'Paste sample CSV' }));

    expect(screen.getByLabelText('Bulk targets CSV')).toHaveValue(
      [
        'email,full_name,organization,farmer_id,plot_id',
        'jane@example.com,Jane Doe,Coop North,farmer-001,plot-001',
        'john@example.com,John Doe,Coop South,farmer-002,plot-002',
      ].join('\n'),
    );
    expect(screen.getByText('Parsed 2 unique targets.')).toBeInTheDocument();
    expect(screen.getByText('Parse summary: 2 valid / 0 invalid excluded.')).toBeInTheDocument();
  });

  it('accepts name alias for full_name and shows alias badge', async () => {
    const user = userEvent.setup();
    render(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.type(
      screen.getByLabelText('Bulk targets CSV'),
      'email,name,organization\njane@example.com,Jane Doe,Coop A\njohn@example.com,John Doe,Coop B',
    );
    await user.click(screen.getByRole('button', { name: 'Parse targets' }));

    expect(screen.getByText('Parsed 2 unique targets.')).toBeInTheDocument();
    expect(screen.getByText('Column aliases applied: name->full_name.')).toBeInTheDocument();
  });

  it('accepts extended aliases for external CRM CSV exports', async () => {
    const user = userEvent.setup();
    render(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.type(
      screen.getByLabelText('Bulk targets CSV'),
      [
        'email_address,name,organization,farmerid,plotid',
        'jane@example.com,Jane Doe,Coop A,farmer-001,plot-001',
        'john@example.com,John Doe,Coop B,farmer-002,plot-002',
      ].join('\n'),
    );
    await user.click(screen.getByRole('button', { name: 'Parse targets' }));

    expect(screen.getByText('Parsed 2 unique targets.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Column aliases applied: email_address->email, name->full_name, farmerid->farmer_id, plotid->plot_id.',
      ),
    ).toBeInTheDocument();
  });

  it('accepts spaced header variants used in spreadsheet exports', async () => {
    const user = userEvent.setup();
    render(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'New Campaign' }));
    await user.type(
      screen.getByLabelText('Bulk targets CSV'),
      [
        'email address,full name,organization,farmer id,plot id',
        'jane@example.com,Jane Doe,Coop A,farmer-001,plot-001',
      ].join('\n'),
    );
    await user.click(screen.getByRole('button', { name: 'Parse targets' }));

    expect(screen.getByText('Parsed 1 unique target.')).toBeInTheDocument();
    expect(screen.getByText('Column aliases applied: email_address->email.')).toBeInTheDocument();
  });

  it('shows onboarding status progress from contacts + campaigns + decisions', async () => {
    vi.mocked(listContacts).mockResolvedValue([
      {
        id: 'contact_1',
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: null,
        organization: null,
        contact_type: 'other',
        status: 'new',
        country: null,
        tags: [],
        consent_status: 'unknown',
        last_activity_at: null,
        created_at: '2026-04-22T09:00:00.000Z',
        updated_at: '2026-04-22T09:00:00.000Z',
      },
    ]);
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/requests/campaigns') && !url.includes('/decisions')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'camp_1',
              title: 'Campaign A',
              description: 'Test',
              request_type: 'GENERAL_EVIDENCE',
              status: 'RUNNING',
              target_organization_ids: [],
              target_farmer_ids: [],
              target_plot_ids: [],
              target_contact_emails: ['jane@example.com'],
              due_at: '2026-05-01T00:00:00.000Z',
              accepted_count: 1,
              pending_count: 0,
              expired_count: 0,
              created_by: 'user_1',
              created_at: '2026-04-22T09:00:00.000Z',
              updated_at: '2026-04-22T12:00:00.000Z',
            },
          ],
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response;
    });

    render(<RequestsPage />);

    expect(await screen.findByText('Activation progress: 3/3 first-value milestones complete.')).toBeInTheDocument();
    expect(screen.getByText('Contacts added')).toBeInTheDocument();
    expect(screen.getByText('Campaign sent')).toBeInTheDocument();
    expect(screen.getByText('First decision received')).toBeInTheDocument();
    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
  });

  it('loads recipient decision timeline in campaign details', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/requests/campaigns') && !url.includes('/decisions')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'camp_1',
              title: 'Campaign Timeline',
              description: 'Timeline test',
              request_type: 'GENERAL_EVIDENCE',
              status: 'RUNNING',
              target_organization_ids: [],
              target_farmer_ids: [],
              target_plot_ids: [],
              target_contact_emails: ['jane@example.com'],
              due_at: '2026-05-01T00:00:00.000Z',
              accepted_count: 1,
              pending_count: 0,
              expired_count: 0,
              created_by: 'user_1',
              created_at: '2026-04-22T09:00:00.000Z',
              updated_at: '2026-04-22T12:00:00.000Z',
            },
          ],
        } as Response;
      }
      if (url.includes('/api/requests/campaigns/camp_1/decisions')) {
        const parsedUrl = new URL(url, 'http://localhost');
        const decision = parsedUrl.searchParams.get('decision') ?? 'all';
        const offset = Number(parsedUrl.searchParams.get('offset') ?? '0');
        const limit = Number(parsedUrl.searchParams.get('limit') ?? '10');
        const fullSet = Array.from({ length: 12 }, (_, index) => ({
          campaign_id: 'camp_1',
          recipient_email: `recipient${index + 1}@example.com`,
          decision: index % 2 === 0 ? 'accept' : 'refuse',
          decided_at: `2026-04-22T12:${String(index).padStart(2, '0')}:00.000Z`,
          source: 'email_cta',
        }));
        const filtered =
          decision === 'accept' || decision === 'refuse'
            ? fullSet.filter((entry) => entry.decision === decision)
            : fullSet;
        const paged = filtered.slice(offset, offset + limit);
        const hasMore = offset + paged.length < filtered.length;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            campaign_id: 'camp_1',
            tenant_id: 'tenant_1',
            last_synced_at: '2026-04-22T12:30:00.000Z',
            decisions: paged,
            counts: {
              all: 12,
              accept: 6,
              refuse: 6,
            },
            pagination: {
              decision,
              limit,
              offset,
              returned: paged.length,
              has_more: hasMore,
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<RequestsPage />);
    const menuButtons = await screen.findAllByRole('button');
    const menuTrigger = menuButtons.find((button) => button.textContent?.trim() === '');
    expect(menuTrigger).toBeDefined();
    await user.click(menuTrigger!);
    await user.click(await screen.findByText('View Details'));

    expect(await screen.findByText('Recipient decision timeline')).toBeInTheDocument();
    expect(await screen.findByText('All (12)')).toBeInTheDocument();
    expect(await screen.findByText('Accepted (6)')).toBeInTheDocument();
    expect(await screen.findByText('Refused (6)')).toBeInTheDocument();
    const emailEntries = await screen.findAllByText('recipient1@example.com');
    expect(emailEntries.length).toBeGreaterThanOrEqual(1);
    const acceptedEntries = await screen.findAllByText(/Accepted via email_cta/i);
    expect(acceptedEntries.length).toBeGreaterThan(0);
    expect(await screen.findByRole('button', { name: 'Load more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Refused \(6\)/ }));
    expect(await screen.findByText('recipient2@example.com')).toBeInTheDocument();
    expect(screen.queryByText('recipient1@example.com')).not.toBeInTheDocument();
  });
});
