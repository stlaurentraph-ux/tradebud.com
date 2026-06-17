// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotMapHero } from './plot-map-hero';
import { PlotDetailProvider } from '@/lib/plot-detail-context';

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

function mockFetchRouter() {
  return vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

    if (url.includes('/map-preview')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'plot_1',
          name: 'Highland plot',
          kind: 'point',
          area_ha: 2.5,
          status: 'compliant',
          geometry: { type: 'Point', coordinates: [30.06, -1.94] },
          ground_truth_photos: {
            clearance_verified_count: 0,
            min_required: 4,
            clearance_eligible: false,
            total_count: 0,
          },
        }),
      } as Response;
    }

    if (url.includes('/evidence-feed')) {
      return { ok: true, status: 200, json: async () => [] } as Response;
    }

    if (url.includes('/compliance-history')) {
      return { ok: true, status: 200, json: async () => [] } as Response;
    }

    if (url.includes('/tenure-verification')) {
      return { ok: true, status: 200, json: async () => [] } as Response;
    }

    return { ok: true, status: 200, json: async () => ({}) } as Response;
  });
}

describe('PlotMapHero', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token');

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

  it('renders slim headline status instead of full readiness checklist', async () => {
    mockFetchRouter();
    render(
      <PlotDetailProvider plotId="plot_1">
        <PlotMapHero plotId="plot_1" />
      </PlotDetailProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Highland plot')).toBeInTheDocument();
    });
    expect(screen.getByText(/blocker before shipment use/i)).toBeInTheDocument();
    expect(screen.getByText(/Deforestation screening:/i)).toBeInTheDocument();
    expect(screen.queryByText('EUDR readiness')).not.toBeInTheDocument();
  });

  it('shows pending state when geometry is missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'plot_2',
        name: 'Empty plot',
        kind: 'point',
        area_ha: null,
        status: 'pending_check',
        geometry: null,
        ground_truth_photos: {
          clearance_verified_count: 0,
          min_required: 4,
          clearance_eligible: false,
          total_count: 0,
        },
      }),
    } as Response);

    render(
      <PlotDetailProvider plotId="plot_2">
        <PlotMapHero plotId="plot_2" />
      </PlotDetailProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No geometry captured yet')).toBeInTheDocument();
    });
  });
});
