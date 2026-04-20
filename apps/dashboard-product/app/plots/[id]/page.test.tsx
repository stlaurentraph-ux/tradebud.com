// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlotDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'plot_1' }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

describe('PlotDetailPage geometry history integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
  });

  it('requests expected sequence when switching sort then paginating', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'evt_1',
            timestamp: '2026-04-16T10:45:33.000Z',
            userId: 'user_1',
            deviceId: null,
            eventType: 'plot_created',
            payload: { plotId: 'plot_1', details: {} },
          },
        ],
        total: 45,
        limit: 20,
        offset: 0,
        sort: 'desc',
      }),
    } as Response);

    render(<PlotDetailPage />);

    const geometryCalls = () =>
      fetchSpy.mock.calls.filter(([url]) =>
        typeof url === 'string' && url.includes('/api/plots/plot_1/geometry-history'),
      );

    await waitFor(() => {
      expect(geometryCalls()).toHaveLength(1);
    });
    expect(geometryCalls()[0]).toEqual([
      '/api/plots/plot_1/geometry-history?limit=20&offset=0&sort=desc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Oldest' }));
    await waitFor(() => {
      expect(geometryCalls()).toHaveLength(2);
    });
    expect(geometryCalls()[1]).toEqual([
      '/api/plots/plot_1/geometry-history?limit=20&offset=0&sort=asc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    ]);

    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await waitFor(() => {
      expect(geometryCalls()).toHaveLength(3);
    });
    expect(geometryCalls()[2]).toEqual([
      '/api/plots/plot_1/geometry-history?limit=20&offset=20&sort=asc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    ]);
  });
});
