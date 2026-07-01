import { Image, StyleSheet, View } from 'react-native';

import type { Plot } from '@/features/state/AppStateContext';
import { PlotBoundaryThumbnail } from '@/components/plot-map/PlotBoundaryThumbnail';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailCapture';
import { plotListThumbnailUriBasePath } from '@/features/mapping/plotListThumbnailStore';

export { PLOT_LIST_THUMB_DISPLAY_SIZE };

type PlotListThumbnailProps = {
  plot: Plot;
  mapImageryOnline?: boolean;
  offlineTilesEnabled?: boolean;
  offlineTilesPackId?: string | null;
};

/** My Plots row preview — cached PNG first; live satellite while backfill runs. */
export function PlotListThumbnail({
  plot,
  mapImageryOnline = false,
  offlineTilesEnabled = false,
  offlineTilesPackId = null,
}: PlotListThumbnailProps) {
  const cachedUri = plot.listThumbnailUri?.trim();
  const imageUri = cachedUri ? plotListThumbnailUriBasePath(cachedUri) : null;
  const canShowLiveSatellite = mapImageryOnline || offlineTilesEnabled;

  if (imageUri) {
    return (
      <View
        style={[styles.wrap, { width: PLOT_LIST_THUMB_DISPLAY_SIZE, height: PLOT_LIST_THUMB_DISPLAY_SIZE }]}
        accessibilityRole="image"
      >
        <Image source={{ uri: imageUri }} style={styles.cachedImage} resizeMode="cover" />
      </View>
    );
  }

  return (
    <PlotBoundaryThumbnail
      plot={plot}
      size={PLOT_LIST_THUMB_DISPLAY_SIZE}
      borderRadius={12}
      offlineTilesEnabled={offlineTilesEnabled}
      offlineTilesPackId={offlineTilesPackId}
      showSatelliteTiles={canShowLiveSatellite}
      cacheOnlineTileLocally={mapImageryOnline}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#B8CBC5',
    borderWidth: 1,
    borderColor: '#C5DDD3',
  },
  cachedImage: {
    width: '100%',
    height: '100%',
  },
});
