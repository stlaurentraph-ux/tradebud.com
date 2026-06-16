import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import type { MapCoordinate } from '@/features/mapping/fieldMapRegion';

type FieldPositionMarkerProps = {
  coordinate: MapCoordinate;
  variant: 'you' | 'start' | 'vertex' | 'standpoint';
  label?: string;
};

export function FieldPositionMarker({ coordinate, variant, label }: FieldPositionMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      title={label}
    >
      {variant === 'you' ? (
        <View style={styles.youWrap}>
          <View style={styles.youPulse} />
          <View style={styles.youCore}>
            <Ionicons name="footsteps" size={16} color="#FFFFFF" />
          </View>
        </View>
      ) : variant === 'standpoint' ? (
        <View style={styles.standpointWrap}>
          <View style={styles.standpointCore}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </View>
      ) : variant === 'start' ? (
        <View style={styles.startWrap}>
          <View style={styles.startCore}>
            <Ionicons name="flag" size={12} color="#FFFFFF" />
          </View>
        </View>
      ) : (
        <View style={styles.vertexWrap}>
          <View style={styles.vertexCore} />
        </View>
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  youWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 127, 89, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(10, 127, 89, 0.45)',
  },
  youCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A7F59',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  startWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standpointWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standpointCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B36A00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  vertexWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertexCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0A7F59',
  },
});
