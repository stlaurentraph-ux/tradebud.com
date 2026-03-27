import MapView, { Marker, Polyline, Region, UrlTile } from 'react-native-maps';
import { View } from 'react-native';
import type { Plot } from '@/features/state/AppStateContext';
import { getOfflineTilesUrlTemplate } from '@/features/offlineTiles/offlineTiles';

export function PlotMap(props: {
  plot: Plot;
  region: Region;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  return (
    <View style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={props.region}
        mapType={props.offlineTilesEnabled || props.lowDataMap ? 'none' : 'standard'}
      >
        {props.offlineTilesEnabled ? (
          <UrlTile
            urlTemplate={getOfflineTilesUrlTemplate(props.offlineTilesPackId ?? undefined)}
            maximumZ={18}
            flipY={false}
          />
        ) : null}
        {props.plot.kind === 'polygon' && props.plot.points.length > 2 ? (
          <Polyline
            coordinates={[...props.plot.points, props.plot.points[0]]}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        ) : null}
        {props.plot.points[0] ? (
          <Marker coordinate={props.plot.points[0]} title={props.plot.name} />
        ) : null}
      </MapView>
    </View>
  );
}

