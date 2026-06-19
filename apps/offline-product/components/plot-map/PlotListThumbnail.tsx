import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { Plot } from '@/features/state/AppStateContext';
import {
  projectPlotToThumbnail,
  thumbnailPointsToSvg,
} from '@/features/mapping/plotThumbnailGeometry';
import { useLanguage } from '@/features/state/LanguageContext';

const THUMB_SIZE = 88;

type PlotListThumbnailProps = {
  plot: Plot;
};

/**
 * Lightweight plot preview for My Plots list cards.
 * Avoids mounting MapView per row (crashes on iPad when multiple maps load).
 */
export function PlotListThumbnail({ plot }: PlotListThumbnailProps) {
  const { t } = useLanguage();

  if (plot.points.length === 0) {
    return (
      <View style={[styles.placeholder, { width: THUMB_SIZE, height: THUMB_SIZE }]}>
        <Ionicons name="map-outline" size={28} color="#6B9080" />
        <ThemedText type="caption" style={styles.placeholderText}>
          {t('plot_map_pending')}
        </ThemedText>
      </View>
    );
  }

  const projected = projectPlotToThumbnail(plot, THUMB_SIZE);
  const first = projected[0];
  const isPolygon = plot.kind === 'polygon' && projected.length > 2;

  return (
    <View style={[styles.wrap, { width: THUMB_SIZE, height: THUMB_SIZE }]}>
      <Svg width={THUMB_SIZE} height={THUMB_SIZE} viewBox={`0 0 ${THUMB_SIZE} ${THUMB_SIZE}`}>
        {isPolygon ? (
          <Polygon
            points={thumbnailPointsToSvg(projected)}
            fill="rgba(10, 127, 89, 0.22)"
            stroke="#0A7F59"
            strokeWidth={2}
          />
        ) : (
          <Polyline
            points={thumbnailPointsToSvg(projected)}
            fill="none"
            stroke="#0A7F59"
            strokeWidth={2}
          />
        )}
        {first ? (
          <Circle
            cx={first.x}
            cy={first.y}
            r={plot.kind === 'point' ? 6 : 5}
            fill="rgba(10, 127, 89, 0.45)"
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8F2ED',
    borderWidth: 1,
    borderColor: '#C5DDD3',
  },
  placeholder: {
    borderRadius: 12,
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
