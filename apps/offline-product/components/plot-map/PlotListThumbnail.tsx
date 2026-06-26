import type { Plot } from '@/features/state/AppStateContext';
import { PlotBoundaryThumbnail } from '@/components/plot-map/PlotBoundaryThumbnail';

export const PLOT_LIST_THUMB_SIZE = 88;

type PlotListThumbnailProps = {
  plot: Plot;
};

/** Static SVG boundary thumbnail for My Plots list rows (no native MapView). */
export function PlotListThumbnail({ plot }: PlotListThumbnailProps) {
  return (
    <PlotBoundaryThumbnail
      plot={plot}
      size={PLOT_LIST_THUMB_SIZE}
      borderRadius={12}
    />
  );
}
