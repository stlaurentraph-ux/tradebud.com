import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type Point = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type SamplePoint = Point & {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  altitudeAccuracyMeters: number | null;
  headingDegrees: number | null;
  speedMps: number | null;
};

type AreaInfo = {
  squareMeters: number;
  hectares: number;
};

type CaptureMode = 'walk' | 'vertex_avg' | 'manual_trace';

function roundTo6(value: number): number {
  return Number(value.toFixed(6));
}

function computeAreaFromPoints(points: Point[]): AreaInfo {
  if (points.length < 3) {
    return { squareMeters: 0, hectares: 0 };
  }

  const R = 6371000; // mean Earth radius in meters

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat0 =
    (points.reduce((sum, p) => sum + p.latitude, 0) / points.length) || points[0].latitude;

  const projected = points.map((p) => {
    const latRad = toRad(p.latitude);
    const lonRad = toRad(p.longitude);
    const lat0Rad = toRad(lat0);

    const x = R * lonRad * Math.cos(lat0Rad);
    const y = R * latRad;
    return { x, y };
  });

  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y - projected[j].x * projected[i].y;
  }

  area = Math.abs(area) / 2;
  const hectares = area / 10_000;

  return { squareMeters: area, hectares };
}

export function useWalkPerimeter() {
  const [points, setPoints] = useState<Point[]>([]);
  const [samples, setSamples] = useState<SamplePoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [area, setArea] = useState<AreaInfo>({ squareMeters: 0, hectares: 0 });
  const [precisionMeters, setPrecisionMeters] = useState<number | null>(null);
  const [mode, setMode] = useState<CaptureMode>('walk');
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const safeStopWatch = () => {
    const sub: any = watchRef.current;
    watchRef.current = null;
    if (!sub) return;
    try {
      if (typeof sub.remove === 'function') {
        sub.remove();
        return;
      }
      if (typeof sub.removeSubscription === 'function') {
        sub.removeSubscription();
        return;
      }
    } catch {
      // Web implementations can differ; ignore cleanup errors.
    }
  };

  const startRecording = async () => {
    try {
      setLastError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLastError('Location permission not granted');
        return;
      }

      setIsRecording(true);
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (loc) => {
          const coordsAny = loc.coords as any;
          const {
            latitude,
            longitude,
            accuracy,
            altitude,
            altitudeAccuracy,
            heading,
            speed,
          } = loc.coords;
          const horizontalAccuracy =
            typeof coordsAny?.horizontalAccuracy === 'number' ? coordsAny.horizontalAccuracy : null;

          const bestPrecision =
            typeof accuracy === 'number'
              ? accuracy
              : typeof horizontalAccuracy === 'number'
                ? horizontalAccuracy
                : null;

          if (bestPrecision != null) {
            setPrecisionMeters(bestPrecision);
          }

          const p: Point = {
            latitude: roundTo6(latitude),
            longitude: roundTo6(longitude),
            timestamp: loc.timestamp ?? Date.now(),
          };

          // Always keep a rolling sample buffer (used for vertex averaging).
          setSamples((prev) => {
            const next: SamplePoint[] = [
              ...prev,
              {
                ...p,
                accuracyMeters: bestPrecision,
                altitudeMeters: typeof altitude === 'number' ? altitude : null,
                altitudeAccuracyMeters:
                  typeof altitudeAccuracy === 'number' ? altitudeAccuracy : null,
                headingDegrees: typeof heading === 'number' ? heading : null,
                speedMps: typeof speed === 'number' ? speed : null,
              },
            ];
            // Keep last ~10 minutes of samples (2s interval ≈ 300 samples)
            return next.length > 300 ? next.slice(next.length - 300) : next;
          });

          if (mode === 'walk') {
            setPoints((prev) => {
              const nextPoints = [...prev, p];
              setArea(computeAreaFromPoints(nextPoints));
              return nextPoints;
            });
          }
        },
      );
    } catch (e) {
      setIsRecording(false);
      setLastError('Failed to start location tracking');
    }
  };

  const stopRecording = () => {
    safeStopWatch();
    setIsRecording(false);
  };

  const reset = () => {
    setPoints([]);
    setSamples([]);
    setLastError(null);
    setArea({ squareMeters: 0, hectares: 0 });
    setPrecisionMeters(null);
  };

  /** Load existing boundary vertices (e.g. editing a saved plot). */
  const replacePointsFromPlot = useCallback((latLngs: { latitude: number; longitude: number }[]) => {
    const now = Date.now();
    const pts: Point[] = latLngs.map((p, i) => ({
      latitude: roundTo6(p.latitude),
      longitude: roundTo6(p.longitude),
      timestamp: now + i,
    }));
    setPoints(pts);
    setArea(computeAreaFromPoints(pts));
    setLastError(null);
  }, []);

  const setCaptureMode = (next: CaptureMode) => {
    setMode(next);
    if (next !== 'walk') {
      // Vertex/manual modes use explicit vertices; do not accumulate walk points automatically.
      setPoints([]);
      setArea({ squareMeters: 0, hectares: 0 });
    }
  };

  const addAveragedVertex = (seconds: number = 60) => {
    const now = Date.now();
    setPoints((prev) => {
      const windowStart = now - seconds * 1000;
      // Read the latest samples snapshot (closure is fine; samples updates frequently).
      const window = samples.filter((s) => s.timestamp >= windowStart);
      if (window.length === 0) {
        return prev;
      }
      const avgLat = window.reduce((sum, p) => sum + p.latitude, 0) / window.length;
      const avgLon = window.reduce((sum, p) => sum + p.longitude, 0) / window.length;
      const nextPoints = [
        ...prev,
        { latitude: roundTo6(avgLat), longitude: roundTo6(avgLon), timestamp: now },
      ];
      setArea(computeAreaFromPoints(nextPoints));
      return nextPoints;
    });
  };

  const addManualVertex = (latitude: number, longitude: number) => {
    const now = Date.now();
    setPoints((prev) => {
      const nextPoints = [
        ...prev,
        { latitude: roundTo6(latitude), longitude: roundTo6(longitude), timestamp: now },
      ];
      setArea(computeAreaFromPoints(nextPoints));
      return nextPoints;
    });
  };

  const undoLastVertex = () => {
    setPoints((prev) => {
      const nextPoints = prev.slice(0, -1);
      setArea(computeAreaFromPoints(nextPoints));
      return nextPoints;
    });
  };

  useEffect(() => {
    return () => {
      safeStopWatch();
    };
  }, []);

  return {
    points,
    samples,
    area,
    precisionMeters,
    isRecording,
    lastError,
    mode,
    setCaptureMode,
    startRecording,
    stopRecording,
    addAveragedVertex,
    addManualVertex,
    undoLastVertex,
    reset,
    replacePointsFromPlot,
  };
}

