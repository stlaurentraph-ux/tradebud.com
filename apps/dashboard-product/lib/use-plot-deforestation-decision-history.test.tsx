// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlotDeforestationDecisionHistory } from './use-plot-deforestation-decision-history';

describe('usePlotDeforestationDecisionHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
  });

  it('runs decision and reloads history after success', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'evt_1',
            timestamp: '2026-04-16T10:45:33.000Z',
            event_type: 'plot_deforestation_decision_recorded',
            payload: {
              plotId: 'plot_1',
              cutoffDate: '2020-12-31',
              verdict: 'no_deforestation_detected',
            },
          },
        ],
      } as Response);

    const { result } = renderHook(() => usePlotDeforestationDecisionHistory('plot_1'));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.runDecision('2020-12-31');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      '/api/plots/plot_1/deforestation-decision?cutoffDate=2020-12-31',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    );
    expect(result.current.events).toHaveLength(1);
  });
});
