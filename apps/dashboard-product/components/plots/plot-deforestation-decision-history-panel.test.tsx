// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotDeforestationDecisionHistoryPanel } from './plot-deforestation-decision-history-panel';
import type { PlotDeforestationDecisionHistoryEvent } from '@/lib/use-plot-deforestation-decision-history';

const hookState = vi.hoisted(() => ({
  events: [] as PlotDeforestationDecisionHistoryEvent[],
  isLoading: false,
  error: null as string | null,
  runDecision: vi.fn().mockResolvedValue({
    ok: true,
    cutoffDate: '2020-12-31',
    verdict: 'no_deforestation_detected',
    providerMode: 'glad_s2_primary',
  }),
}));

vi.mock('@/lib/use-plot-deforestation-decision-history', () => ({
  usePlotDeforestationDecisionHistory: () => hookState,
}));

describe('PlotDeforestationDecisionHistoryPanel', () => {
  beforeEach(() => {
    hookState.events = [];
    hookState.isLoading = false;
    hookState.error = null;
    hookState.runDecision = vi.fn().mockResolvedValue({
      ok: true,
      cutoffDate: '2020-12-31',
      verdict: 'no_deforestation_detected',
      providerMode: 'glad_s2_primary',
    });
  });

  it('renders loading state', () => {
    hookState.isLoading = true;
    render(<PlotDeforestationDecisionHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Loading deforestation decisions...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    hookState.error = 'Plot scope violation';
    render(<PlotDeforestationDecisionHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Deforestation decision history unavailable')).toBeInTheDocument();
    expect(screen.getByText('Plot scope violation')).toBeInTheDocument();
  });

  it('renders decision rows', () => {
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        eventType: 'plot_deforestation_decision_recorded',
        payload: {
          plotId: 'plot_1',
          cutoffDate: '2020-12-31',
          verdict: 'no_deforestation_detected',
          providerMode: 'glad_s2_primary',
          summary: {
            alertCount: 0,
            alertAreaHa: 0,
          },
        },
      },
    ];
    render(<PlotDeforestationDecisionHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('2020-12-31')).toBeInTheDocument();
    expect(screen.getByText('no_deforestation_detected')).toBeInTheDocument();
    expect(screen.getByText('0 / 0 ha')).toBeInTheDocument();
    expect(screen.getByText('glad_s2_primary')).toBeInTheDocument();
  });

  it('runs decision with selected cutoff date', async () => {
    const user = userEvent.setup();
    render(<PlotDeforestationDecisionHistoryPanel plotId="plot_1" />);

    await user.type(screen.getByLabelText('Deforestation cutoff date'), '2020-12-31');
    await user.click(screen.getByRole('button', { name: 'Run decision' }));

    expect(hookState.runDecision).toHaveBeenCalledWith('2020-12-31');
    expect(await screen.findByText('Decision run recorded for cutoff 2020-12-31.')).toBeInTheDocument();
    expect(
      screen.getByText('Last run: cutoff 2020-12-31 | verdict no_deforestation_detected | provider mode glad_s2_primary'),
    ).toBeInTheDocument();
  });

  it('shows retry action after failed run attempt', async () => {
    const user = userEvent.setup();
    hookState.runDecision = vi.fn().mockRejectedValue(new Error('Backend unavailable'));
    render(<PlotDeforestationDecisionHistoryPanel plotId="plot_1" />);

    await user.type(screen.getByLabelText('Deforestation cutoff date'), '2020-12-31');
    await user.click(screen.getByRole('button', { name: 'Run decision' }));

    expect(await screen.findByText('Backend unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
