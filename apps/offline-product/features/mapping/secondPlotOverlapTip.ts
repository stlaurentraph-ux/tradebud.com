export const SECOND_PLOT_OVERLAP_TIP_DISMISSED_KEY = 'secondPlotOverlapTipDismissed';

/** First-time overlap hint when registering the second plot on this phone. */
export function shouldShowSecondPlotOverlapTip(params: {
  existingPlotCount: number;
  isEditingPlot: boolean;
  dismissed: boolean;
}): boolean {
  if (params.isEditingPlot || params.dismissed) return false;
  return params.existingPlotCount === 1;
}
