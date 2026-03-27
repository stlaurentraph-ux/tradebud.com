import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type Point = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type AreaInfo = {
  squareMeters: number;
  hectares: number;
};

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
  const [isRecording, setIsRecording] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [area, setArea] = useState<AreaInfo>({ squareMeters: 0, hectares: 0 });
  const [precisionMeters, setPrecisionMeters] = useState<number | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

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
          const { latitude, longitude, accuracy, horizontalAccuracy } = loc.coords;

          const bestPrecision =
            typeof accuracy === 'number'
              ? accuracy
              : typeof horizontalAccuracy === 'number'
                ? horizontalAccuracy
                : null;

          if (bestPrecision != null) {
            setPrecisionMeters(bestPrecision);
          }

          setPoints((prev) => {
            const nextPoints = [
              ...prev,
              {
                latitude: roundTo6(latitude),
                longitude: roundTo6(longitude),
                timestamp: loc.timestamp ?? Date.now(),
              },
            ];
            setArea(computeAreaFromPoints(nextPoints));
            return nextPoints;
          });
        },
      );
    } catch (e) {
      setIsRecording(false);
      setLastError('Failed to start location tracking');
    }
  };

  const stopRecording = () => {
    watchRef.current?.remove();
    watchRef.current = null;
    setIsRecording(false);
  };

  const reset = () => {
    setPoints([]);
    setLastError(null);
    setArea({ squareMeters: 0, hectares: 0 });
    setPrecisionMeters(null);
  };

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
    };
  }, []);

  return {
    points,
    area,
    precisionMeters,
    isRecording,
    lastError,
    startRecording,
    stopRecording,
    reset,
  };
}

