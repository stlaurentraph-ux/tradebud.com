import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Plot } from '@/features/state/AppStateContext';
import type { MapCoordinate } from '@/features/compliance/groundTruthPhotoGeo';
import type { Region } from 'react-native-maps';

export function PhotoVaultMap(props: {
  plot: Plot;
  region: Region;
  userPosition: MapCoordinate | null;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
  mapHeight?: number;
}) {
  const mapHeight = props.mapHeight ?? 120;
  return (
    <View
      style={{
        height: mapHeight,
        borderRadius: 14,
        backgroundColor: '#E8F5EF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <ThemedText type="caption" style={{ textAlign: 'center' }}>
        Field map preview is available in the mobile app.
      </ThemedText>
    </View>
  );
}
