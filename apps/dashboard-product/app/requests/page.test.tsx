// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsPage from './page';

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

vi.mock('@/components/common/permission-gate', () => ({
  PermissionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('RequestsPage bulk target import', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
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
  });

  it('shows error banner when draft creation fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Only exporters can create campaigns.' }),
    } as Response);
    const { user } = await fillCampaignAndParseTargets();

    await user.click(screen.getByRole('button', { name: 'Create Draft' }));

    expect(await screen.findByText('Only exporters can create campaigns.')).toBeInTheDocument();
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

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
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
});
