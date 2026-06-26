import Svg, { Circle, Polygon } from 'react-native-svg';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { Plot } from '@/features/state/AppStateContext';
import {
  projectPlotToThumbnail,
  thumbnailPointsToSvg,
} from '@/features/mapping/plotThumbnailGeometry';
import { useLanguage } from '@/features/state/LanguageContext';

export type PlotBoundaryThumbnailProps = {
  plot: Plot;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Lightweight SVG boundary preview for plot lists — avoids N native MapView mounts. */
export function PlotBoundaryThumbnail({
  plot,
  size = 88,
  borderRadius = 12,
  style,
}: PlotBoundaryThumbnailProps) {
  const { t } = useLanguage();

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

  const projected = projectPlotToThumbnail(plot, size);
  const polygonPoints = thumbnailPointsToSvg(projected);

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
    backgroundColor: '#E8F2ED',
    borderWidth: 1,
    borderColor: '#C5DDD3',
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
