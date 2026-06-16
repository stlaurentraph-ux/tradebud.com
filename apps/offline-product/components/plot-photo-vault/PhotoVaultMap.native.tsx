import MapView, { Circle, type Region } from 'react-native-maps';
import { View } from 'react-native';

import { FieldMapAttribution } from '@/components/plot-map/FieldMapAttribution';
import { FieldMapLayers } from '@/components/plot-map/FieldMapLayers';
import { FieldPositionMarker } from '@/components/plot-map/FieldPositionMarker';
import { PlotBoundaryOverlays } from '@/components/plot-map/PlotBoundaryOverlays';
import type { MapCoordinate } from '@/features/compliance/groundTruthPhotoGeo';
import {
  fieldMapUsesCustomTiles,
  FIELD_MAP_CAPTURE_UI_PROPS,
  resolveFieldMapTileMode,
} from '@/features/mapping/fieldMapTiles';
import type { Plot } from '@/features/state/AppStateContext';

export function PhotoVaultMap(props: {
  plot: Plot;
  region: Region;
  standpoint: MapCoordinate | null;
  userPosition: MapCoordinate | null;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  const tileMode = resolveFieldMapTileMode(props);

  return (
    <View style={{ height: 200, borderRadius: 14, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={props.region}
        {...FIELD_MAP_CAPTURE_UI_PROPS}
        mapType={fieldMapUsesCustomTiles(tileMode) ? 'none' : 'standard'}
      >
        <FieldMapLayers
          lowDataMap={props.lowDataMap}
          offlineTilesEnabled={props.offlineTilesEnabled}
          offlineTilesPackId={props.offlineTilesPackId}
        />
        {props.plot.kind === 'polygon' && props.plot.points.length >= 3 ? (
          <PlotBoundaryOverlays
            vertices={props.plot.points}
            showYouMarker={false}
            showStartMarker={false}
          />
        ) : null}
        {props.plot.kind === 'point' && props.standpoint ? (
          <Circle
            center={props.standpoint}
            radius={props.plot.precisionMetersAtSave ?? 25}
            fillColor="rgba(10, 127, 89, 0.22)"
            strokeColor="#0A7F59"
            strokeWidth={2}
          />
        ) : null}
        {props.standpoint ? (
          <FieldPositionMarker coordinate={props.standpoint} variant="standpoint" />
        ) : null}
        {props.userPosition ? (
          <FieldPositionMarker coordinate={props.userPosition} variant="you" />
        ) : null}
      </MapView>
      <FieldMapAttribution
        lowDataMap={props.lowDataMap}
        offlineTilesEnabled={props.offlineTilesEnabled}
      />
    </View>
  );
}
