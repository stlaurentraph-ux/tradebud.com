// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlotDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'plot_1' }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', active_role: 'exporter', tenant_id: 't1', roles: ['exporter'] },
  }),
}));

function mockPlotDetailFetch() {
  return vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

    if (url.includes('/map-preview')) {
      return {
        ok: true,
        json: async () => ({
          id: 'plot_1',
          name: 'Plot One',
          kind: 'polygon',
          area_ha: 1.2,
          status: 'deforestation_clear',
          geometry: {
            type: 'Polygon',
            coordinates: [[[30.06, -1.94], [30.061, -1.94], [30.061, -1.939], [30.06, -1.94]]],
          },
          ground_truth_photos: { clearance_verified_count: 4, min_required: 4, clearance_eligible: true, total_count: 4 },
        }),
      } as Response;
    }

    if (url.includes('/geometry-history')) {
      return {
        ok: true,
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
      } as Response;
    }

    if (url.includes('/evidence-feed') || url.includes('/compliance-history') || url.includes('/tenure-verification') || url.includes('/deforestation')) {
      return { ok: true, json: async () => [] } as Response;
    }

    return { ok: true, json: async () => ({}) } as Response;
  });
}

describe('PlotDetailPage geometry history integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 960;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 480;
      },
    });
  });

  it('links to the dedicated history route without loading geometry history on the summary page', async () => {
    const fetchSpy = mockPlotDetailFetch();

    render(<PlotDetailPage />);

    const geometryCalls = () =>
      fetchSpy.mock.calls.filter(([url]) =>
        typeof url === 'string' && url.includes('/api/plots/plot_1/geometry-history'),
      );

    await waitFor(() => {
      expect(screen.getByText('Plot One')).toBeInTheDocument();
    });

    expect(geometryCalls()).toHaveLength(0);

    const historyLink = screen.getByRole('link', { name: /Open full audit timeline/i });
    expect(historyLink).toHaveAttribute('href', '/plots/plot_1/history');
  });
});
