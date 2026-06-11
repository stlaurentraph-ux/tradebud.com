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
    expect(gfwSummaryToPlotStatus({ alertCount: 0, alertAreaHa: 0 })).toBe('compliant');

    expect(gfwSummaryToSignalTier({ alertCount: 2, alertAreaHa: 0.01 })).toBe('amber');
    expect(gfwSummaryToPlotStatus({ alertCount: 2, alertAreaHa: 0.01 })).toBe('under_review');

    expect(gfwSummaryToSignalTier({ alertCount: 3, alertAreaHa: 0.2 })).toBe('red');
    expect(gfwSummaryToPlotStatus({ alertCount: 3, alertAreaHa: 0.2 })).toBe('deforestation_detected');

    expect(gfwSummaryToPlotStatus({ alertCount: null, alertAreaHa: null })).toBe('pending_check');
  });

  it('merges overlap and GFW statuses using strictest outcome', () => {
    expect(overlapToPlotStatus(false, false)).toBe('compliant');
    expect(overlapToPlotStatus(true, false)).toBe('degradation_risk');
    expect(overlapToPlotStatus(true, true)).toBe('deforestation_detected');

    expect(
      mergePlotComplianceStatus('compliant', gfwSummaryToPlotStatus({ alertCount: 2, alertAreaHa: 0.2 })),
    ).toBe('deforestation_detected');
    expect(mergePlotComplianceStatus('compliant', 'pending_check')).toBe('compliant');
  });

  it('blocks under_review clearance until geo+timestamp verified photos are synced', () => {
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'compliant',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 2,
      }),
    ).toBe('under_review');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'compliant',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 4,
      }),
    ).toBe('compliant');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'compliant',
        currentStatus: 'pending_check',
        clearanceVerifiedGroundTruthPhotoCount: 0,
      }),
    ).toBe('compliant');
    expect(
      applyReviewClearanceGate({
        proposedStatus: 'compliant',
        currentStatus: 'under_review',
        clearanceVerifiedGroundTruthPhotoCount: 0,
        contextAutoClear: true,
      }),
    ).toBe('compliant');
  });

  it('maps deforestation verdicts to plot status', () => {
    expect(verdictToPlotStatus('no_deforestation_detected', { alertCount: 0, alertAreaHa: 0 })).toBe(
      'compliant',
    );
    expect(
      verdictToPlotStatus('possible_deforestation_detected', { alertCount: 1, alertAreaHa: 0.01 }),
    ).toBe('under_review');
    expect(verdictToPlotStatus('unknown', { alertCount: null, alertAreaHa: null })).toBe('pending_check');
  });

  it('accepts only verified deforestation-free plot statuses for package bundling', () => {
    expect(isPlotDeforestationFreeVerified('compliant')).toBe(true);
    expect(isPlotDeforestationFreeVerified('verified')).toBe(true);
    expect(isPlotDeforestationFreeVerified('degradation_risk')).toBe(false);
    expect(isPlotDeforestationFreeVerified('deforestation_detected')).toBe(false);
    expect(isPlotDeforestationFreeVerified('pending_check')).toBe(false);
    expect(isPlotDeforestationFreeVerified(null)).toBe(false);
  });
});
