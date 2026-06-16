import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  isAtPhotoCaptureLocation,
  type MapCoordinate,
} from '@/features/compliance/groundTruthPhotoGeo';
import type { Plot } from '@/features/state/AppStateContext';

export type PhotoVaultGpsState = {
  position: MapCoordinate | null;
  accuracyM: number | null;
  headingDeg: number | null;
  permissionDenied: boolean;
  captureReady: boolean;
};

export function usePhotoVaultGps(plot: Plot | null): PhotoVaultGpsState {
  const [position, setPosition] = useState<MapCoordinate | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const positionWatchRef = useRef<Location.LocationSubscription | null>(null);
  const headingWatchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setAccuracyM(pos.coords.accuracy ?? null);
        }
      } catch {
        // watch will retry
      }

      positionWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 2,
          timeInterval: 2000,
        },
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setAccuracyM(pos.coords.accuracy ?? null);
        },
      );

      try {
        headingWatchRef.current = await Location.watchHeadingAsync((heading) => {
          const deg = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
          if (Number.isFinite(deg)) {
            setHeadingDeg(deg);
          }
        });
      } catch {
        setHeadingDeg(null);
      }
    };

    void start();

    return () => {
      cancelled = true;
      positionWatchRef.current?.remove();
      positionWatchRef.current = null;
      headingWatchRef.current?.remove();
      headingWatchRef.current = null;
    };
  }, [plot?.id]);

  const captureReady =
    plot != null &&
    position != null &&
    isAtPhotoCaptureLocation(position.latitude, position.longitude, plot);

  return {
    position,
    accuracyM,
    headingDeg,
    permissionDenied,
    captureReady,
  };
}

/** Fresh fix at shutter time — never reuse plot boundary points. */
export async function readDeviceCaptureCoordinates(): Promise<MapCoordinate | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  } catch {
    return null;
  }
}
