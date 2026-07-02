import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { Plot } from '@/features/state/AppStateContext';
import { PlotBoundaryThumbnail } from '@/components/plot-map/PlotBoundaryThumbnail';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailCapture';
import {
  plotListThumbnailNeedsLayoutRefresh,
  plotListThumbnailUriBasePath,
} from '@/features/mapping/plotListThumbnailStore';

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
  mapImageryOnline: _mapImageryOnline = false,
  offlineTilesEnabled = false,
  offlineTilesPackId = null,
}: PlotListThumbnailProps) {
  const [cachedImageFailed, setCachedImageFailed] = useState(false);
  const cachedUri = plot.listThumbnailUri?.trim();
  const useCached =
    cachedUri &&
    !cachedImageFailed &&
    !plotListThumbnailNeedsLayoutRefresh(cachedUri);
  const imageUri = useCached ? plotListThumbnailUriBasePath(cachedUri) : null;

  if (imageUri) {
    return (
      <View
        style={[styles.wrap, { width: PLOT_LIST_THUMB_DISPLAY_SIZE, height: PLOT_LIST_THUMB_DISPLAY_SIZE }]}
        accessibilityRole="image"
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.cachedImage}
          resizeMode="cover"
          onError={() => setCachedImageFailed(true)}
        />
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
      showSatelliteTiles
      cacheOnlineTileLocally={!offlineTilesEnabled}
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
