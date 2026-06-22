import { Platform } from 'react-native';
import { Polygon, Polyline } from 'react-native-maps';

import { FieldPositionMarker } from '@/components/plot-map/FieldPositionMarker';
import type { MapCoordinate } from '@/features/mapping/fieldMapRegion';
import {
  boundaryStrokeCoordinates,
  sanitizeMapCoordinates,
  shouldShowStartMarker,
} from '@/features/mapping/plotBoundaryOverlayRender';
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
  /**
   * Stroke-only preview while manually tracing on satellite tiles.
   * Filled Polygon + UrlTile is unstable on iOS when the ring first closes.
   */
  strokeOnlyBoundary?: boolean;
  /** Only set true on stable basemaps; closing stroke rings on tiles can crash MapView. */
  closeStrokeRing?: boolean;
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
  strokeOnlyBoundary = false,
  closeStrokeRing = false,
}: PlotBoundaryOverlaysProps) {
  const safeVertices = sanitizeMapCoordinates(vertices);
  const safeLiveTrail = sanitizeMapCoordinates(liveTrail);
  const youPosition = resolveYouPosition({
    liveTrail: safeLiveTrail,
    userPosition,
    vertices: safeVertices,
  });
  const strokeCoordinates = boundaryStrokeCoordinates(safeVertices, {
    closeRing: strokeOnlyBoundary ? closeStrokeRing : true,
  });
  const showStart = shouldShowStartMarker({
    showStartMarker,
    showVertexMarkers,
    vertexCount: safeVertices.length,
  });

  return (
    <>
      {isRecording && safeLiveTrail.length > 1 ? (
        <Polyline
          coordinates={safeLiveTrail}
          strokeColor={LIVE_TRAIL_COLOR}
          strokeWidth={4}
          lineDashPattern={[10, 7]}
          zIndex={ANDROID_OVERLAY_BASE_Z + 1}
        />
      ) : null}

      {!strokeOnlyBoundary && safeVertices.length >= 3 ? (
        <Polygon
          coordinates={safeVertices}
          fillColor={BOUNDARY_FILL}
          strokeColor={BOUNDARY_GREEN}
          strokeWidth={4}
          geodesic
          zIndex={ANDROID_OVERLAY_BASE_Z + 2}
        />
      ) : null}

      {strokeOnlyBoundary && strokeCoordinates.length >= 2 ? (
        <Polyline
          key={`stroke-${strokeCoordinates.length}-${strokeCoordinates[0]?.latitude ?? 0}-${strokeCoordinates[0]?.longitude ?? 0}`}
          coordinates={strokeCoordinates}
          strokeColor={BOUNDARY_GREEN}
          strokeWidth={4}
          geodesic
          zIndex={ANDROID_OVERLAY_BASE_Z + 2}
        />
      ) : null}

      {!strokeOnlyBoundary && safeVertices.length === 2 ? (
        <Polyline
          coordinates={safeVertices}
          strokeColor={BOUNDARY_GREEN}
          strokeWidth={isRecording ? 5 : 4}
          geodesic
          zIndex={ANDROID_OVERLAY_BASE_Z + 3}
        />
      ) : null}

      {showStart ? (
        <FieldPositionMarker coordinate={safeVertices[0]} variant="start" />
      ) : null}

      {showVertexMarkers
        ? safeVertices.map((p, idx) => (
            <FieldPositionMarker
              key={`vertex-${p.latitude.toFixed(6)}-${p.longitude.toFixed(6)}`}
              coordinate={p}
              variant="vertex"
              label={`${idx + 1}`}
              trackInitially={idx === safeVertices.length - 1}
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
