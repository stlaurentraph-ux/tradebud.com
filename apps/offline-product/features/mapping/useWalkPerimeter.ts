import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { roundWgs84Coordinate } from '@/features/geo/coordinates';

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

import { WALK_CAPTURE_MAX_ACCURACY_M } from '@/features/mapping/walkCaptureCoaching';

type CaptureMode = 'walk' | 'vertex_avg' | 'manual_trace';

const WALK_MIN_DISTANCE_M = 4;
const WALK_MAX_ACCURACY_M = WALK_CAPTURE_MAX_ACCURACY_M;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function weightedAverageSamples(window: SamplePoint[]): Point | null {
  if (window.length === 0) return null;

  let weightSum = 0;
  let latSum = 0;
  let lonSum = 0;
  for (const s of window) {
    const acc = s.accuracyMeters;
    const w = acc != null && acc > 0 ? 1 / (acc * acc) : 1;
    weightSum += w;
    latSum += s.latitude * w;
    lonSum += s.longitude * w;
  }
  if (weightSum <= 0) return null;

  return {
    latitude: roundWgs84Coordinate(latSum / weightSum),
    longitude: roundWgs84Coordinate(lonSum / weightSum),
    timestamp: window[window.length - 1].timestamp,
  };
}

function computeAreaFromPoints(points: Point[]): AreaInfo {
  if (points.length < 3) {
    return { squareMeters: 0, hectares: 0 };
  }

  const R = 6371000; // mean Earth radius in meters

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

export function useWalkPerimeter(options?: { onLocationDenied?: () => void }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [samples, setSamples] = useState<SamplePoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [area, setArea] = useState<AreaInfo>({ squareMeters: 0, hectares: 0 });
  const [precisionMeters, setPrecisionMeters] = useState<number | null>(null);
  const [lastSpeedMps, setLastSpeedMps] = useState<number | null>(null);
  const [gpsFixDropped, setGpsFixDropped] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('walk');
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const samplesRef = useRef<SamplePoint[]>([]);
  const modeRef = useRef<CaptureMode>('walk');
  const lastEmittedRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const pendingWalkSamplesRef = useRef<SamplePoint[]>([]);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const clearWalkEmitState = () => {
    lastEmittedRef.current = null;
    pendingWalkSamplesRef.current = [];
  };

  const tryEmitWalkPoint = (sample: SamplePoint) => {
    const last = lastEmittedRef.current;
    const accuracy = sample.accuracyMeters;

    if (accuracy != null && accuracy > WALK_MAX_ACCURACY_M && last) {
      setGpsFixDropped(true);
      return;
    }

    pendingWalkSamplesRef.current.push(sample);

    const dist = last
      ? haversineMeters(last.latitude, last.longitude, sample.latitude, sample.longitude)
      : Infinity;

    if (last && dist < WALK_MIN_DISTANCE_M) {
      return;
    }

    const window = pendingWalkSamplesRef.current;
    pendingWalkSamplesRef.current = [];

    const averaged = weightedAverageSamples(window);
    if (!averaged) return;

    lastEmittedRef.current = {
      latitude: averaged.latitude,
      longitude: averaged.longitude,
    };
    setGpsFixDropped(false);

    setPoints((prev) => {
      const nextPoints = [...prev, averaged];
      setArea(computeAreaFromPoints(nextPoints));
      return nextPoints;
    });
  };

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
        options?.onLocationDenied?.();
        setLastError('location_denied');
        return;
      }

      if (modeRef.current === 'walk') {
        clearWalkEmitState();
      }

      setIsRecording(true);
      watchRef.current = await Location.watchPositionAsync(
        {
          // Prefer best available GNSS (dual-frequency when OS supports it).
          accuracy: Location.Accuracy.Highest,
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

          const speedMps = typeof speed === 'number' && speed >= 0 ? speed : null;
          if (speedMps != null) {
            setLastSpeedMps(speedMps);
          }

          const sample: SamplePoint = {
            latitude: roundWgs84Coordinate(latitude),
            longitude: roundWgs84Coordinate(longitude),
            timestamp: loc.timestamp ?? Date.now(),
            accuracyMeters: bestPrecision,
            altitudeMeters: typeof altitude === 'number' ? altitude : null,
            altitudeAccuracyMeters:
              typeof altitudeAccuracy === 'number' ? altitudeAccuracy : null,
            headingDegrees: typeof heading === 'number' ? heading : null,
            speedMps,
          };

          if (
            modeRef.current === 'walk' &&
            bestPrecision != null &&
            bestPrecision <= WALK_MAX_ACCURACY_M &&
            lastEmittedRef.current
          ) {
            setGpsFixDropped(false);
          }

          setSamples((prev) => {
            const next: SamplePoint[] = [...prev, sample];
            // Keep last ~10 minutes of samples (2s interval ≈ 300 samples)
            return next.length > 300 ? next.slice(next.length - 300) : next;
          });

          if (modeRef.current === 'walk') {
            tryEmitWalkPoint(sample);
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
    setLastSpeedMps(null);
    setGpsFixDropped(false);
    clearWalkEmitState();
  };

  /** Load existing boundary vertices (e.g. editing a saved plot). */
  const replacePointsFromPlot = useCallback((latLngs: { latitude: number; longitude: number }[]) => {
    const now = Date.now();
    const pts: Point[] = latLngs.map((p, i) => ({
      latitude: roundWgs84Coordinate(p.latitude),
      longitude: roundWgs84Coordinate(p.longitude),
      timestamp: now + i,
    }));
    setPoints(pts);
    setArea(computeAreaFromPoints(pts));
    setLastError(null);
    clearWalkEmitState();
  }, []);

  const setCaptureMode = (next: CaptureMode) => {
    setMode(next);
    clearWalkEmitState();
    if (next !== 'walk') {
      // Vertex/manual modes use explicit vertices; do not accumulate walk points automatically.
      setPoints([]);
      setArea({ squareMeters: 0, hectares: 0 });
    }
  };

  const addAveragedVertex = (seconds: number = 30): Point | null => {
    const now = Date.now();
    const windowStart = now - seconds * 1000;
    const window = samplesRef.current.filter((s) => s.timestamp >= windowStart);
    if (window.length === 0) {
      return null;
    }

    const averaged = weightedAverageSamples(window);
    if (
      !averaged ||
      !Number.isFinite(averaged.latitude) ||
      !Number.isFinite(averaged.longitude) ||
      Math.abs(averaged.latitude) > 90 ||
      Math.abs(averaged.longitude) > 180
    ) {
      return null;
    }

    const vertex: Point = { ...averaged, timestamp: now };
    setLastError(null);
    setPoints((prev) => {
      const nextPoints = [...prev, vertex];
      setArea(computeAreaFromPoints(nextPoints));
      return nextPoints;
    });
    return vertex;
  };

  const addManualVertex = (latitude: number, longitude: number) => {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return;
    }
    const now = Date.now();
    setPoints((prev) => {
      const nextPoints = [
        ...prev,
        { latitude: roundWgs84Coordinate(latitude), longitude: roundWgs84Coordinate(longitude), timestamp: now },
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
    lastSpeedMps,
    gpsFixDropped,
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
