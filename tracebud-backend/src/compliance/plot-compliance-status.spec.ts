import {
  applyReviewClearanceGate,
  gfwSummaryToPlotStatus,
  gfwSummaryToSignalTier,
  isPlotDeforestationFreeVerified,
  mergePlotComplianceStatus,
  overlapToPlotStatus,
  verdictToPlotStatus,
} from './plot-compliance-status';

describe('plot-compliance-status', () => {
  it('maps GFW alert tiers to plot status', () => {
    expect(gfwSummaryToSignalTier({ alertCount: 0, alertAreaHa: 0 })).toBe('green');
    expect(gfwSummaryToPlotStatus({ alertCount: 0, alertAreaHa: 0 })).toBe('deforestation_clear');

    expect(gfwSummaryToSignalTier({ alertCount: 2, alertAreaHa: 0.01 })).toBe('amber');
    expect(gfwSummaryToPlotStatus({ alertCount: 2, alertAreaHa: 0.01 })).toBe('under_review');

    expect(gfwSummaryToSignalTier({ alertCount: 3, alertAreaHa: 0.2 })).toBe('red');
    expect(gfwSummaryToPlotStatus({ alertCount: 3, alertAreaHa: 0.2 })).toBe('deforestation_detected');

    expect(gfwSummaryToPlotStatus({ alertCount: null, alertAreaHa: null })).toBe('pending_check');
  });

  it('merges overlap and GFW statuses using strictest outcome', () => {
    expect(overlapToPlotStatus(false, false)).toBe('deforestation_clear');
    expect(overlapToPlotStatus(true, false)).toBe('degradation_risk');
    expect(overlapToPlotStatus(true, true)).toBe('deforestation_detected');

    expect(
      mergePlotComplianceStatus('deforestation_clear', gfwSummaryToPlotStatus({ alertCount: 2, alertAreaHa: 0.2 })),
    ).toBe('deforestation_detected');
    expect(mergePlotComplianceStatus('deforestation_clear', 'pending_check')).toBe('deforestation_clear');
  });

  it('blocks under_review clearance until geo+timestamp verified photos are synced', () => {
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'deforestation_clear',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 2,
      }),
    ).toBe('under_review');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'deforestation_clear',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 4,
      }),
    ).toBe('deforestation_clear');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'deforestation_clear',
        currentStatus: 'pending_check',
        clearanceVerifiedGroundTruthPhotoCount: 0,
      }),
    ).toBe('deforestation_clear');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'deforestation_clear',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 0,
        contextAutoClear: true,
      }),
    ).toBe('deforestation_clear');
  });

  it('maps deforestation verdicts to plot status', () => {
    expect(verdictToPlotStatus('no_deforestation_detected', { alertCount: 0, alertAreaHa: 0 })).toBe(
      'deforestation_clear',
    );
    expect(
      verdictToPlotStatus('possible_deforestation_detected', { alertCount: 1, alertAreaHa: 0.01 }),
    ).toBe('under_review');
    expect(verdictToPlotStatus('unknown', { alertCount: null, alertAreaHa: null })).toBe('pending_check');
  });

  it('accepts only verified deforestation-free plot statuses for package bundling', () => {
    expect(isPlotDeforestationFreeVerified('deforestation_clear')).toBe(true);
    expect(isPlotDeforestationFreeVerified('compliant')).toBe(true);
    expect(isPlotDeforestationFreeVerified('verified')).toBe(true);
    expect(isPlotDeforestationFreeVerified('degradation_risk')).toBe(false);
    expect(isPlotDeforestationFreeVerified('deforestation_detected')).toBe(false);
    expect(isPlotDeforestationFreeVerified('pending_check')).toBe(false);
    expect(isPlotDeforestationFreeVerified(null)).toBe(false);
  });
});
