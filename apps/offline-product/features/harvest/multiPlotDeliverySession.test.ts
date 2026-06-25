import { describe, expect, it, vi } from 'vitest';
import {
  buildMultiPlotLinesFromWeights,
  canAddLineToSession,
  inlineMultiPlotWeightsComplete,
  reservedKgByPlot,
  sessionTotalKg,
  submitMultiPlotDeliverySession,
  type HarvestPlotOption,
} from './multiPlotDeliverySession';

vi.mock('@/features/harvest/submitHarvest', () => ({
  submitHarvestRecord: vi.fn(),
}));

vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: {
    MULTI_PLOT_DELIVERY_STARTED: 'multi_plot_delivery_started',
    MULTI_PLOT_DELIVERY_SUBMITTED: 'multi_plot_delivery_submitted',
  },
  trackEvent: vi.fn(),
}));

import { submitHarvestRecord } from '@/features/harvest/submitHarvest';

const plot: HarvestPlotOption = { id: 'plot_a', name: 'Block A', area_ha: 2 };

describe('multiPlotDeliverySession', () => {
  it('tracks reserved kg per plot in session', () => {
    expect(
      reservedKgByPlot([
        { plotId: 'plot_a', plotName: 'A', kg: 100 },
        { plotId: 'plot_b', plotName: 'B', kg: 50 },
        { plotId: 'plot_a', plotName: 'A', kg: 25 },
      ]),
    ).toEqual({ plot_a: 125, plot_b: 50 });
    expect(sessionTotalKg([{ plotId: 'plot_a', plotName: 'A', kg: 100 }])).toBe(100);
  });

  it('accepts any positive weight (buyer-side cap checks happen on server)', () => {
    const deliveredByPlot = { plot_a: 2950 };
    expect(
      canAddLineToSession({
        plot,
        kg: 100,
        deliveredByPlot,
        existingLines: [],
      }),
    ).toEqual({ ok: true });

    expect(
      canAddLineToSession({
        plot: { id: 'plot_b', name: 'B', area_ha: 2 },
        kg: 50,
        deliveredByPlot: { plot_b: 2960 },
        existingLines: [],
      }),
    ).toEqual({ ok: true });
  });

  it('rejects duplicate plots and local-only plots', () => {
    expect(
      canAddLineToSession({
        plot: { ...plot, localOnly: true },
        kg: 10,
        deliveredByPlot: {},
        existingLines: [],
      }),
    ).toEqual({ ok: false, reason: 'local_only' });

    expect(
      canAddLineToSession({
        plot,
        kg: 10,
        deliveredByPlot: {},
        existingLines: [{ plotId: 'plot_a', plotName: 'A', kg: 10 }],
      }),
    ).toEqual({ ok: false, reason: 'duplicate_plot' });
  });

  it('builds delivery lines from inline weight map', () => {
    const built = buildMultiPlotLinesFromWeights({
      plots: [
        { id: 'plot_a', name: 'Block A', area_ha: 2 },
        { id: 'plot_b', name: 'Block B', area_ha: 3 },
      ],
      weightByPlotId: { plot_a: '100', plot_b: '80' },
      deliveredByPlot: {},
    });
    expect(built).toEqual({
      ok: true,
      lines: [
        { plotId: 'plot_a', plotName: 'Block A', kg: 100 },
        { plotId: 'plot_b', plotName: 'Block B', kg: 80 },
      ],
    });
    expect(
      inlineMultiPlotWeightsComplete({
        plots: [{ id: 'plot_a', name: 'Block A', area_ha: 2 }],
        weightByPlotId: { plot_a: '50' },
        deliveredByPlot: {},
      }),
    ).toBe(true);
  });

  it('submits each line sequentially and preserves per-line outcomes', async () => {
    vi.mocked(submitHarvestRecord)
      .mockResolvedValueOnce({ status: 'synced', qrCodeRef: 'V-AAA', receiptId: 'r1' })
      .mockResolvedValueOnce({
        status: 'queued',
        messageKey: 'harvest_queued_offline',
        receiptId: 'r2',
      });

    const results = await submitMultiPlotDeliverySession({
      farmerId: 'farmer_1',
      lines: [
        { plotId: 'plot_a', plotName: 'A', kg: 100 },
        { plotId: 'plot_b', plotName: 'B', kg: 80 },
      ],
      localPlots: [],
      backendPlots: [],
      sessionId: 'sess_1',
    });

    expect(submitHarvestRecord).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      {
        plotId: 'plot_a',
        plotName: 'A',
        kg: 100,
        status: 'synced',
        qrCodeRef: 'V-AAA',
        // Multi-line sessions (>1 line) generate a shared delivery trip ref grouping the lines.
        deliveryTripRef: expect.stringMatching(/^T-/),
        buyerInvitePending: false,
      },
      {
        plotId: 'plot_b',
        plotName: 'B',
        kg: 80,
        status: 'queued',
        deliveryTripRef: expect.stringMatching(/^T-/),
        messageKey: 'harvest_queued_offline',
      },
    ]);
    // The trip ref is generated once per session and shared across every line.
    expect(results[0].deliveryTripRef).toBe(results[1].deliveryTripRef);
  });
});
