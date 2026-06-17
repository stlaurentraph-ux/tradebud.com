// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotGeometryReviewerPanel } from './plot-geometry-reviewer-panel';

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { active_role: 'exporter' },
  }),
}));

const noisyPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [30.0612, -1.9441],
      [30.06125, -1.94405],
      [30.0613, -1.94408],
      [30.0624, -1.9441],
      [30.0624, -1.9432],
      [30.0612, -1.9432],
      [30.0612, -1.9441],
    ],
  ],
};

describe('PlotGeometryReviewerPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (url.includes('/map-preview')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'plot_1',
            name: 'Noisy plot',
            kind: 'polygon',
            area_ha: 1.2,
            status: 'under_review',
            geometry: noisyPolygon,
            geometry_capture: {
              geometry_confidence_tier: 'low',
              geometry_confidence_score: 42,
              capture_method: 'MOBILE_GPS',
            },
          }),
        } as Response;
      }

      if (url.includes('/geometry') && init?.method === 'PATCH') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'plot_1', kind: 'polygon' }),
        } as Response;
      }

      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });
  });

  it('renders reviewer assist for exporter on low-confidence polygon', async () => {
    render(<PlotGeometryReviewerPanel plotId="plot_1" />);

    await waitFor(() => {
      expect(screen.getByText('Boundary review assist')).toBeTruthy();
    });
    expect(screen.getByText('Low confidence capture')).toBeTruthy();
  });

  it('applies revision when reason and simplification are valid', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<PlotGeometryReviewerPanel plotId="plot_1" />);

    await waitFor(() => {
      expect(screen.getByText('Boundary review assist')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Audit reason (required)'), {
      target: { value: 'Removed GPS jitter after cooperative review' },
    });

    const applyButton = screen.getByRole('button', { name: 'Apply reviewed revision' });
    await waitFor(() => {
      expect((applyButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/plots/plot_1/geometry',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });
});
