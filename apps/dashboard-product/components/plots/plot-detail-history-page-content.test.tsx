// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotDetailHistoryPageContent } from './plot-detail-history-page-content';

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

function mockHistoryFetch() {
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
          status: 'compliant',
          geometry: {
            type: 'Polygon',
            coordinates: [[[30.06, -1.94], [30.061, -1.94], [30.061, -1.939], [30.06, -1.94]]],
          },
          ground_truth_photos: {
            clearance_verified_count: 4,
            min_required: 4,
            clearance_eligible: true,
            total_count: 4,
          },
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
          total: 1,
          limit: 20,
          offset: 0,
          sort: 'desc',
        }),
      } as Response;
    }

    return { ok: true, json: async () => ({}) } as Response;
  });
}

describe('PlotDetailHistoryPageContent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
  });

  it('loads geometry history immediately on the dedicated route', async () => {
    const fetchSpy = mockHistoryFetch();

    render(<PlotDetailHistoryPageContent plotId="plot_1" />);

    await waitFor(() => {
      expect(screen.getByText('Geometry & audit history')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        fetchSpy.mock.calls.some(([url]) =>
          typeof url === 'string' && url.includes('/api/plots/plot_1/geometry-history'),
        ),
      ).toBe(true);
    });

    expect(screen.getByRole('link', { name: /Back to plot summary/i })).toHaveAttribute(
      'href',
      '/plots/plot_1',
    );
  });
});
