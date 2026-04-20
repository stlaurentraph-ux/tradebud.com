// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotAssignmentLifecyclePanel } from './plot-assignment-lifecycle-panel';

describe('PlotAssignmentLifecyclePanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token');
  });

  it('maps ASN error codes to operator guidance', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0, limit: 10, offset: 0 }),
    } as Response);
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'ASN-003: Invalid assignment state transition.' }),
    } as Response);

    render(<PlotAssignmentLifecyclePanel plotId="plot_1" />);
    await user.type(screen.getByLabelText('Assignment ID'), 'assign_1');
    await user.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid assignment transition. Refresh status before retrying.')).toBeInTheDocument();
    });
  });

  it('shows success state when create succeeds', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0, limit: 10, offset: 0 }),
    } as Response);
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ assignmentId: 'assign_1', status: 'active' }),
    } as Response);
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ assignmentId: 'assign_1', status: 'active', agentUserId: 'agent_1', assignedAt: '2026-01-01T00:00:00.000Z' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);

    render(<PlotAssignmentLifecyclePanel plotId="plot_1" />);
    await user.type(screen.getByLabelText('Assignment ID'), 'assign_1');
    await user.type(screen.getByLabelText('Agent user ID'), 'agent_1');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Assignment assign_1 is now active.')).toBeInTheDocument();
    });
  });

  it('loads assignment history and allows click-to-fill assignment id', async () => {
    const user = userEvent.setup();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            assignmentId: 'assign_hist_1',
            plotId: 'plot_1',
            agentUserId: 'agent_1',
            agentName: 'Agent One',
            agentEmail: 'agent.one@example.com',
            status: 'active',
            assignedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);

    render(<PlotAssignmentLifecyclePanel plotId="plot_1" />);
    await waitFor(() => {
      expect(screen.getByText('assign_hist_1')).toBeInTheDocument();
    });
    expect(screen.getAllByText('active').length).toBeGreaterThan(0);
    expect(screen.getByText('agent.one@example.com')).toBeInTheDocument();
    await user.click(screen.getByText('assign_hist_1'));
    expect((screen.getByLabelText('Assignment ID') as HTMLInputElement).value).toBe('assign_hist_1');
  });

  it('exports filtered assignment history to csv', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            assignmentId: 'assign_csv_1',
            plotId: 'plot_1',
            agentUserId: 'agent_1',
            agentName: 'Agent One',
            agentEmail: 'agent.one@example.com',
            status: 'active',
            assignedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        'assignment_id,plot_id,agent_user_id,agent_name,agent_email,status,assigned_at,ended_at\n"assign_csv_1","plot_1","agent_1","Agent One","agent.one@example.com","active","2026-01-01T00:00:00.000Z",""',
      headers: new Headers({ 'x-export-row-count': '1' }),
    } as Response);
    const createObjectUrlMock = vi.fn(() => 'blob:csv');
    const revokeObjectUrlMock = vi.fn(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = clickSpy;
        anchor.remove = removeSpy;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    render(<PlotAssignmentLifecyclePanel plotId="plot_1" />);
    await waitFor(() => {
      expect(screen.getByText('assign_csv_1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported 1 assignment rows to CSV.')).toBeInTheDocument();
  });
});
