import MapView, { Circle, Polyline, Region } from 'react-native-maps';
import { View } from 'react-native';
import type { Plot } from '@/features/state/AppStateContext';
import { FieldMapAttribution } from '@/components/plot-map/FieldMapAttribution';
import { FieldMapLayers } from '@/components/plot-map/FieldMapLayers';
import {
  fieldMapUsesCustomTiles,
  FIELD_MAP_VIEW_UI_PROPS,
  resolveFieldMapTileMode,
} from '@/features/mapping/fieldMapTiles';

export function PlotMap(props: {
  plot: Plot;
  region: Region;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  const tileMode = resolveFieldMapTileMode(props);

  return (
    <View style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={props.region}
        {...FIELD_MAP_VIEW_UI_PROPS}
        mapType={fieldMapUsesCustomTiles(tileMode) ? 'none' : 'standard'}
      >
        <FieldMapLayers
          lowDataMap={props.lowDataMap}
          offlineTilesEnabled={props.offlineTilesEnabled}
          offlineTilesPackId={props.offlineTilesPackId}
        />
        {props.plot.kind === 'polygon' && props.plot.points.length > 2 ? (
          <Polyline
            coordinates={[...props.plot.points, props.plot.points[0]]}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        ) : null}
        {props.plot.points[0] ? (
          <Circle
            center={props.plot.points[0]}
            radius={18}
            fillColor="rgba(10, 127, 89, 0.35)"
            strokeColor="#0A7F59"
            strokeWidth={2}
          />
        ) : null}
      </MapView>
      <FieldMapAttribution
        lowDataMap={props.lowDataMap}
        offlineTilesEnabled={props.offlineTilesEnabled}
      />
    </View>
  );
}
