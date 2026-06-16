import {
  applyFdpCommodityToPlotStatus,
  assessFdpTemporalStability,
  emptyFdpCommoditySummary,
  fdpCommodityToSignal,
  fdpSupportsAutoReviewClear,
  screeningSupportsAutoReviewClear,
} from './fdp-commodity-fusion';
import { FDP_COFFEE_AFRICA_PROFILES } from './fdp-commodity-profiles';

function coffeeSummary(overrides: Partial<ReturnType<typeof emptyFdpCommoditySummary>> = {}) {
  return {
    ...emptyFdpCommoditySummary({ commodity: 'coffee', countryCode: 'TZ' }),
    ok: true,
    countryLabel: 'Tanzania',
    years: {
      '2019': { mean: 0.42, p50: 0.4, p90: 0.65 },
      '2020': { mean: 0.44, p50: 0.41, p90: 0.66 },
      '2021': { mean: 0.43, p50: 0.4, p90: 0.64 },
    },
    competingCommodity: 'cocoa',
    competingProbMean: 0.08,
    temporalStability: 'stable' as const,
    ...overrides,
  };
}

describe('fdp-commodity-fusion', () => {
  it('marks stable Tanzania coffee plots as legitimate', () => {
    const summary = coffeeSummary();
    const thresholds = FDP_COFFEE_AFRICA_PROFILES.TZ.thresholds;
    expect(assessFdpTemporalStability(summary, thresholds)).toBe('stable');
    expect(fdpCommodityToSignal(summary, thresholds)).toBe('legitimate');
  });

  it('flags emerging post-cutoff coffee conversion', () => {
    const summary = coffeeSummary({
      years: {
        '2019': { mean: 0.12, p50: 0.1, p90: 0.2 },
        '2020': { mean: 0.18, p50: 0.15, p90: 0.25 },
        '2021': { mean: 0.55, p50: 0.52, p90: 0.7 },
      },
      temporalStability: 'emerging',
    });
    const thresholds = FDP_COFFEE_AFRICA_PROFILES.RW.thresholds;
    expect(fdpCommodityToSignal(summary, thresholds)).toBe('emerging');
  });

  it('flags commodity mismatch when competing crop dominates', () => {
    const summary = coffeeSummary({
      years: {
        '2019': { mean: 0.1, p50: 0.08, p90: 0.15 },
        '2020': { mean: 0.12, p50: 0.1, p90: 0.18 },
        '2021': { mean: 0.11, p50: 0.09, p90: 0.16 },
      },
      competingCommodity: 'palm',
      competingProbMean: 0.72,
      temporalStability: 'unknown',
    });
    const thresholds = FDP_COFFEE_AFRICA_PROFILES.NG.thresholds;
    expect(fdpCommodityToSignal(summary, thresholds)).toBe('mismatch');
  });

  it('downgrades compliant plots to under_review on mismatch', () => {
    expect(
      applyFdpCommodityToPlotStatus({
        fdpSignal: 'mismatch',
        productionSystem: 'monoculture',
        baseStatus: 'compliant',
      }),
    ).toBe('under_review');
  });

  it('clears amber shade-grown plots when FDP reads legitimate coffee', () => {
    expect(
      applyFdpCommodityToPlotStatus({
        fdpSignal: 'legitimate',
        productionSystem: 'shade_grown',
        baseStatus: 'under_review',
      }),
    ).toBe('compliant');
  });

  it('never weakens deforestation_detected outcomes', () => {
    expect(
      applyFdpCommodityToPlotStatus({
        fdpSignal: 'legitimate',
        productionSystem: 'shade_grown',
        baseStatus: 'deforestation_detected',
      }),
    ).toBe('deforestation_detected');
  });

  it('supports auto-clear from FDP alone for agroforestry systems', () => {
    expect(
      fdpSupportsAutoReviewClear({
        fdpSignal: 'legitimate',
        productionSystem: 'agroforestry',
        proposedStatus: 'compliant',
      }),
    ).toBe(true);
    expect(
      screeningSupportsAutoReviewClear({
        gfwContextSignal: 'unknown',
        fdpSignal: 'legitimate',
        productionSystem: 'agroforestry',
        proposedStatus: 'compliant',
      }),
    ).toBe(true);
  });
});
