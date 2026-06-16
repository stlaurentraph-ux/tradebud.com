import { Platform } from 'react-native';
import { Polygon, Polyline } from 'react-native-maps';

import { FieldPositionMarker } from '@/components/plot-map/FieldPositionMarker';
import type { MapCoordinate } from '@/features/mapping/fieldMapRegion';
import { resolveYouPosition } from '@/features/mapping/plotBoundaryOverlayLogic';

const BOUNDARY_GREEN = '#0A7F59';
const BOUNDARY_FILL = 'rgba(10, 127, 89, 0.28)';
const LIVE_TRAIL_COLOR = 'rgba(14, 165, 233, 0.75)';
const ANDROID_OVERLAY_BASE_Z = Platform.OS === 'android' ? 10 : 0;

type PlotBoundaryOverlaysProps = {
  vertices: MapCoordinate[];
  /** Raw GPS path while walking — shown before vertices are emitted. */
  liveTrail?: MapCoordinate[];
  /** Idle GPS position before recording starts. */
  userPosition?: MapCoordinate | null;
  isRecording?: boolean;
  showYouMarker?: boolean;
  showStartMarker?: boolean;
  showVertexMarkers?: boolean;
  /** Keep the you-marker visible while the coordinate updates during capture. */
  youMarkerFollowsPosition?: boolean;
};

export function PlotBoundaryOverlays({
  vertices,
  liveTrail = [],
  userPosition = null,
  isRecording = false,
  showYouMarker = true,
  showStartMarker = true,
  showVertexMarkers = false,
  youMarkerFollowsPosition = false,
}: PlotBoundaryOverlaysProps) {
  const youPosition = resolveYouPosition({ liveTrail, userPosition, vertices });

  const boundaryLine =
    vertices.length === 2
      ? vertices
      : [];

  return (
    <>
      {isRecording && liveTrail.length > 1 ? (
        <Polyline
          coordinates={liveTrail}
          strokeColor={LIVE_TRAIL_COLOR}
          strokeWidth={4}
          lineDashPattern={[10, 7]}
          zIndex={ANDROID_OVERLAY_BASE_Z + 1}
        />
      ) : null}

      {vertices.length >= 3 ? (
        <Polygon
          coordinates={vertices}
          fillColor={BOUNDARY_FILL}
          strokeColor={BOUNDARY_GREEN}
          strokeWidth={4}
          zIndex={ANDROID_OVERLAY_BASE_Z + 2}
        />
      ) : null}

      {boundaryLine.length === 2 ? (
        <Polyline
          coordinates={boundaryLine}
          strokeColor={BOUNDARY_GREEN}
          strokeWidth={isRecording ? 5 : 4}
          zIndex={ANDROID_OVERLAY_BASE_Z + 3}
        />
      ) : null}

      {showStartMarker && vertices.length > 0 ? (
        <FieldPositionMarker coordinate={vertices[0]} variant="start" />
      ) : null}

      {showVertexMarkers
        ? vertices.map((p, idx) => (
            <FieldPositionMarker
              key={`vertex-${idx}-${p.latitude}-${p.longitude}`}
              coordinate={p}
              variant="vertex"
              label={`${idx + 1}`}
            />
          ))
        : null}

      {showYouMarker && youPosition ? (
        <FieldPositionMarker
          coordinate={youPosition}
          variant="you"
          followPosition={youMarkerFollowsPosition}
        />
      ) : null}
    </>
  );
}
