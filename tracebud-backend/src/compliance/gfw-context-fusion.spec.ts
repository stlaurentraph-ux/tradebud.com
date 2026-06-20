import {
  applyGfwContextToPlotStatus,
  contextSupportsAutoReviewClear,
  gfwContextToSignal,
} from './gfw-context-fusion';

describe('gfw-context-fusion', () => {
  it('marks stable tropical canopy with low Hansen loss as canopy_stable', () => {
    expect(
      gfwContextToSignal({
        tropicalTreeCoverAvgPct: 72,
        tropicalTreeCoverAreaHa: 1.2,
        treeCoverLossHa: 0,
        naturalForestHa: null,
      }),
    ).toBe('canopy_stable');
  });

  it('marks significant Hansen loss as loss_confirmed', () => {
    expect(
      gfwContextToSignal({
        tropicalTreeCoverAvgPct: 80,
        tropicalTreeCoverAreaHa: 1.2,
        treeCoverLossHa: 0.5,
        naturalForestHa: null,
      }),
    ).toBe('loss_confirmed');
  });

  it('downgrades amber alerts for shade-grown plots when canopy is stable', () => {
    expect(
      applyGfwContextToPlotStatus({
        alertSummary: { alertCount: 2, alertAreaHa: 0.01 },
        context: {
          tropicalTreeCoverAvgPct: 72,
          tropicalTreeCoverAreaHa: 1.2,
          treeCoverLossHa: 0,
          naturalForestHa: null,
        },
        contextSignal: 'canopy_stable',
        productionSystem: 'shade_grown',
      }),
    ).toBe('deforestation_clear');
  });

  it('does not downgrade amber alerts for monoculture plots', () => {
    expect(
      applyGfwContextToPlotStatus({
        alertSummary: { alertCount: 2, alertAreaHa: 0.01 },
        context: {
          tropicalTreeCoverAvgPct: 72,
          tropicalTreeCoverAreaHa: 1.2,
          treeCoverLossHa: 0,
          naturalForestHa: null,
        },
        contextSignal: 'canopy_stable',
        productionSystem: 'monoculture',
      }),
    ).toBe('under_review');
  });

  it('allows context auto-clear only for agroforestry production systems', () => {
    expect(
      contextSupportsAutoReviewClear({
        contextSignal: 'canopy_stable',
        productionSystem: 'agroforestry',
        proposedStatus: 'deforestation_clear',
      }),
    ).toBe(true);
    expect(
      contextSupportsAutoReviewClear({
        contextSignal: 'canopy_stable',
        productionSystem: 'monoculture',
        proposedStatus: 'deforestation_clear',
      }),
    ).toBe(false);
  });
});
