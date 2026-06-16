import { describe, expect, it } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';
import {
  computePlotPhotoStandpoint,
  countGeoVerifiedGroundTruthDirections,
  GROUND_TRUTH_DIRECTIONS,
  headingDeltaToDirection,
  isAtPhotoCaptureLocation,
  isGroundTruthPhotoSetComplete,
  photoForDirection,
} from './groundTruthPhotoGeo';

const pointPlot: Plot = {
  id: 'p1',
  farmerId: 'f1',
  name: 'Point plot',
  createdAt: Date.now(),
  areaSquareMeters: 1000,
  areaHectares: 0.1,
  kind: 'point',
  points: [{ latitude: 14.123456, longitude: -87.123456 }],
  precisionMetersAtSave: 25,
};

const polygonPlot: Plot = {
  id: 'p2',
  farmerId: 'f1',
  name: 'Polygon plot',
  createdAt: Date.now(),
  areaSquareMeters: 10000,
  areaHectares: 1,
  kind: 'polygon',
  points: [
    { latitude: 14.123456, longitude: -87.123456 },
    { latitude: 14.123556, longitude: -87.123456 },
    { latitude: 14.123556, longitude: -87.123556 },
    { latitude: 14.123456, longitude: -87.123556 },
  ],
};

function photo(
  partial: Partial<PlotPhoto> & Pick<PlotPhoto, 'plotId' | 'uri' | 'takenAt'>,
): PlotPhoto {
  return {
    id: 1,
    latitude: null,
    longitude: null,
    direction: null,
    ...partial,
  };
}

describe('groundTruthPhotoGeo', () => {
  it('uses last GPS point as standpoint for point plots', () => {
    expect(computePlotPhotoStandpoint(pointPlot)).toEqual({
      latitude: 14.123456,
      longitude: -87.123456,
    });
  });

  it('uses centroid as standpoint for polygon plots', () => {
    const standpoint = computePlotPhotoStandpoint(polygonPlot);
    expect(standpoint?.latitude).toBeCloseTo(14.123506, 5);
    expect(standpoint?.longitude).toBeCloseTo(-87.123506, 5);
  });

  it('gates point plots by radius and polygons by inside test', () => {
    expect(isAtPhotoCaptureLocation(14.123456, -87.123456, pointPlot)).toBe(true);
    expect(isAtPhotoCaptureLocation(14.2, -87.2, pointPlot)).toBe(false);
    expect(isAtPhotoCaptureLocation(14.1235, -87.1235, polygonPlot)).toBe(true);
    expect(isAtPhotoCaptureLocation(14.13, -87.13, polygonPlot)).toBe(false);
  });

  it('resolves photos per direction with legacy index fallback', () => {
    const photos = [
      photo({ plotId: 'p2', uri: 'a', takenAt: Date.now(), direction: null }),
      photo({ plotId: 'p2', uri: 'b', takenAt: Date.now(), direction: 'east' }),
    ];
    expect(photoForDirection(photos, 'north')?.uri).toBe('a');
    expect(photoForDirection(photos, 'east')?.uri).toBe('b');
  });

  it('requires geo-verified photos in all four directions', () => {
    const now = Date.now();
    const photos = GROUND_TRUTH_DIRECTIONS.map((direction) =>
      photo({
        plotId: polygonPlot.id,
        uri: direction,
        takenAt: now,
        direction,
        latitude: 14.1235,
        longitude: -87.1235,
      }),
    );
    expect(countGeoVerifiedGroundTruthDirections(photos, polygonPlot)).toBe(4);
    expect(isGroundTruthPhotoSetComplete(photos, polygonPlot)).toBe(true);
  });

  it('computes heading delta toward cardinal targets', () => {
    expect(headingDeltaToDirection(350, 'north')).toBe(10);
    expect(headingDeltaToDirection(10, 'west')).toBe(-100);
  });
});
