import type { Plot } from '@/features/state/AppStateContext';
import { computeRegionFromPlot } from '@/features/mapping/plotMapRegion';
import { PlotMapPreview } from '@/components/plot-map/PlotMapPreview';

export const PLOT_LIST_THUMB_SIZE = 88;

type PlotListThumbnailProps = {
  plot: Plot;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
};

/** Esri satellite tile + boundary overlay in the My Plots list square. */
export function PlotListThumbnail({
  plot,
  offlineTilesEnabled,
  offlineTilesPackId,
}: PlotListThumbnailProps) {
  return (
    <PlotMapPreview
      plot={plot}
      region={computeRegionFromPlot(plot)}
      offlineTilesEnabled={offlineTilesEnabled}
      offlineTilesPackId={offlineTilesPackId}
      width={PLOT_LIST_THUMB_SIZE}
      height={PLOT_LIST_THUMB_SIZE}
      borderRadius={12}
      showAttribution={false}
    />
  );
}
