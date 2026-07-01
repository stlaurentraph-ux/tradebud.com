import { useEffect, useMemo, useState } from 'react';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { Plot } from '@/features/state/AppStateContext';
import {
  projectPlotToThumbnail,
  thumbnailPointsToSvg,
} from '@/features/mapping/plotThumbnailGeometry';
import { resolvePlotListSatelliteTileLayout } from '@/features/mapping/plotListSatelliteTile';
import { listOfflineTilePacks } from '@/features/offlineTiles/offlineTiles';
import { useLanguage } from '@/features/state/LanguageContext';

export type PlotBoundaryThumbnailProps = {
  plot: Plot;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  offlineTilesEnabled?: boolean;
  offlineTilesPackId?: string | null;
  showSatelliteTiles?: boolean;
  /** Prefetch Esri tile to disk before Image load (list + backfill). */
  cacheOnlineTileLocally?: boolean;
  /** Fires after satellite tile Image paints (backfill capture). */
  onImageryPainted?: () => void;
  /** Fires when satellite tile cannot load for this plot. */
  onImageryUnavailable?: () => void;
};

/** Plot list thumbnail — Esri/offline satellite tile under SVG boundary (no MapView). */
export function PlotBoundaryThumbnail({
  plot,
  size = 88,
  borderRadius = 12,
  style,
  offlineTilesEnabled = false,
  offlineTilesPackId = null,
  showSatelliteTiles = true,
  cacheOnlineTileLocally = false,
  onImageryPainted,
  onImageryUnavailable,
}: PlotBoundaryThumbnailProps) {
  const { t } = useLanguage();
  const [satelliteLayout, setSatelliteLayout] = useState<Awaited<
    ReturnType<typeof resolvePlotListSatelliteTileLayout>
  > | null>(null);

  const projected = useMemo(
    () => projectPlotToThumbnail(plot, size),
    [plot, size],
  );
  const polygonPoints = thumbnailPointsToSvg(projected);

  useEffect(() => {
    if (!showSatelliteTiles || plot.points.length === 0) {
      setSatelliteLayout(null);
      return;
    }
    let cancelled = false;
    void resolvePlotListSatelliteTileLayout(plot, size, {
      offlineTilesEnabled,
      offlineTilesPackId,
      listPacks: listOfflineTilePacks,
      cacheOnlineTileLocally,
    })
      .then((layout) => {
        if (cancelled) return;
        setSatelliteLayout(layout);
        if (!layout) onImageryUnavailable?.();
      })
      .catch(() => {
        if (!cancelled) {
          setSatelliteLayout(null);
          onImageryUnavailable?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [plot, size, showSatelliteTiles, offlineTilesEnabled, offlineTilesPackId, cacheOnlineTileLocally, onImageryUnavailable]);

  if (plot.points.length === 0) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius }, style]}>
        <Ionicons name="map-outline" size={28} color="#6B9080" />
        <ThemedText type="caption" style={styles.placeholderText}>
          {t('plot_map_pending')}
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius }, style]}
      accessibilityLabel={t('plot_list_satellite_preview')}
      accessibilityRole="image"
    >
      {satelliteLayout ? (
        <Image
          source={{ uri: satelliteLayout.uri }}
          style={{
            position: 'absolute',
            left: satelliteLayout.left,
            top: satelliteLayout.top,
            width: satelliteLayout.width,
            height: satelliteLayout.height,
          }}
          resizeMode="stretch"
          onLoad={() => onImageryPainted?.()}
          onError={() => onImageryUnavailable?.()}
        />
      ) : (
        <View style={StyleSheet.absoluteFillObject} />
      )}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.overlay}>
        {plot.kind === 'polygon' && projected.length >= 3 ? (
          <Polygon
            points={polygonPoints}
            fill="rgba(10, 127, 89, 0.22)"
            stroke="#0A7F59"
            strokeWidth={2}
          />
        ) : projected[0] ? (
          <Circle
            cx={projected[0].x}
            cy={projected[0].y}
            r={10}
            fill="rgba(10, 127, 89, 0.35)"
            stroke="#0A7F59"
            strokeWidth={2}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#B8CBC5',
    borderWidth: 1,
    borderColor: '#C5DDD3',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    backgroundColor: '#E8F2ED',
    borderWidth: 1,
    borderColor: '#C5DDD3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});
