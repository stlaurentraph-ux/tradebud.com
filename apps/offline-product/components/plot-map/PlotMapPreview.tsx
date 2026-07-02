import MapView, { Circle, Polyline, type Region } from 'react-native-maps';
import { useEffect, useMemo, useState } from 'react';
import {
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { FieldMapAttribution } from '@/components/plot-map/FieldMapAttribution';
import { FieldMapMountGate } from '@/components/plot-map/FieldMapMountGate';
import type { Plot } from '@/features/state/AppStateContext';
import { FieldMapLayers } from '@/components/plot-map/FieldMapLayers';
import {
  fieldMapUsesCustomTiles,
  FIELD_MAP_VIEW_UI_PROPS,
  resolveFieldMapTileMode,
} from '@/features/mapping/fieldMapTiles';
import { shouldBlockNativeMapView } from '@/features/mapping/androidMapsConfig';
import { useLanguage } from '@/features/state/LanguageContext';
import { AndroidMapsUnavailablePlaceholder } from '@/components/plot-map/AndroidMapsUnavailablePlaceholder';

/** Scroll padding (16) + Card md padding (16) on each side — plot detail hero width fallback. */
const PLOT_DETAIL_HERO_WIDTH_INSET = 64;

export type PlotMapPreviewProps = {
  plot: Plot;
  region?: Region;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  showAttribution?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PlotMapPreview({
  plot,
  region,
  offlineTilesEnabled,
  offlineTilesPackId,
  width = 88,
  height = 88,
  borderRadius = 12,
  showAttribution = false,
  style,
}: PlotMapPreviewProps) {
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const [mapMounted, setMapMounted] = useState(Platform.OS !== 'ios');
  const tileMode = resolveFieldMapTileMode({
    lowDataMap: false,
    offlineTilesEnabled,
  });

  const resolvedWidth = useMemo(() => {
    if (typeof width === 'number') return width;
    if (layoutWidth != null && layoutWidth > 0) return layoutWidth;
    return Math.max(120, windowWidth - PLOT_DETAIL_HERO_WIDTH_INSET);
  }, [layoutWidth, width, windowWidth]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const task = InteractionManager.runAfterInteractions(() => {
      setMapMounted(true);
    });
    return () => task.cancel();
  }, []);

  if (!region || plot.points.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: resolvedWidth, height, borderRadius },
          style,
        ]}
      >
        <Ionicons name="map-outline" size={height >= 120 ? 36 : 28} color="#6B9080" />
        <ThemedText type="caption" style={styles.placeholderText}>
          {t('plot_map_pending')}
        </ThemedText>
      </View>
    );
  }

  if (shouldBlockNativeMapView()) {
    return (
      <AndroidMapsUnavailablePlaceholder
        style={[
          styles.placeholder,
          { width: resolvedWidth, height, borderRadius },
          style,
        ]}
        iconSize={height >= 120 ? 36 : 28}
      />
    );
  }

  return (
    <View
      collapsable={false}
      onLayout={
        typeof width === 'string'
          ? (event) => {
              const next = Math.round(event.nativeEvent.layout.width);
              if (next > 0) setLayoutWidth(next);
            }
          : undefined
      }
      style={[
        styles.wrap,
        { width: resolvedWidth, height, borderRadius },
        style,
      ]}
    >
      {mapMounted ? (
        <FieldMapMountGate
          blockedStyle={{ flex: 1 }}
          placeholderIconSize={height >= 120 ? 36 : 28}
          mapView={
            <MapView
              style={{ flex: 1 }}
              initialRegion={region}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              cacheEnabled={Platform.OS === 'android'}
              toolbarEnabled={false}
              {...FIELD_MAP_VIEW_UI_PROPS}
              mapType={fieldMapUsesCustomTiles(tileMode) ? 'none' : 'standard'}
            >
              <FieldMapLayers
                lowDataMap={false}
                offlineTilesEnabled={offlineTilesEnabled}
                offlineTilesPackId={offlineTilesPackId}
              />
              {plot.kind === 'polygon' && plot.points.length > 2 ? (
                <Polyline
                  coordinates={[...plot.points, plot.points[0]]}
                  strokeColor="#0A7F59"
                  strokeWidth={height >= 120 ? 3 : 2}
                />
              ) : null}
              {plot.points[0] ? (
                <Circle
                  center={plot.points[0]}
                  radius={plot.kind === 'point' ? 18 : 14}
                  fillColor="rgba(10, 127, 89, 0.35)"
                  strokeColor="#0A7F59"
                  strokeWidth={2}
                />
              ) : null}
            </MapView>
          }
        />
      ) : (
        <View style={styles.mapBootPlaceholder} />
      )}
      {showAttribution ? (
        <FieldMapAttribution lowDataMap={false} offlineTilesEnabled={offlineTilesEnabled} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#B8CBC5',
  },
  mapBootPlaceholder: {
    flex: 1,
    backgroundColor: '#B8CBC5',
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
