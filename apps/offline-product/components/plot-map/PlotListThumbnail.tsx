import type { PlotMapPreviewProps } from '@/components/plot-map/PlotMapPreview';
import { PlotMapPreview } from '@/components/plot-map/PlotMapPreview';

const THUMB_SIZE = 88;

/** 88×88 list-card map thumbnail (My Plots). */
export function PlotListThumbnail(props: Omit<PlotMapPreviewProps, 'width' | 'height' | 'borderRadius'>) {
  return (
    <PlotMapPreview
      {...props}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      borderRadius={12}
    />
  );
}
