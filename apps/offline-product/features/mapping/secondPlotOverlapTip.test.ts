import { describe, expect, it } from 'vitest';

import { shouldShowSecondPlotOverlapTip } from './secondPlotOverlapTip';

describe('shouldShowSecondPlotOverlapTip', () => {
  it('shows only for the second plot registration', () => {
    expect(
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: 1,
        isEditingPlot: false,
        dismissed: false,
      }),
    ).toBe(true);
  });

  it('hides when editing or already dismissed', () => {
    expect(
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: 1,
        isEditingPlot: true,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: 1,
        isEditingPlot: false,
        dismissed: true,
      }),
    ).toBe(false);
  });

  it('hides for first plot or third+ plot', () => {
    expect(
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: 0,
        isEditingPlot: false,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: 2,
        isEditingPlot: false,
        dismissed: false,
      }),
    ).toBe(false);
  });
});
