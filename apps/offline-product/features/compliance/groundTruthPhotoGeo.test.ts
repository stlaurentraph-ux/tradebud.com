import { describe, expect, it } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';
import {
  computePlotPhotoStandpoint,
  distanceToPlotBorderM,
  headingDeltaToDirection,
  isAtPhotoCaptureLocation,
  isGroundTruthPhotoSetComplete,
  isPhotoStandpointReady,
  nextGroundTruthPhotoSlotIndex,
  photoForDirection,
  resolveRequiredInwardFromBorderM,
  plotRequiresInwardPhotoStandoff,
  GROUND_TRUTH_DIRECTIONS,
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

  it('requires inward clearance from border before photo standpoint on plots ≥ 4 ha', () => {
    const largePlot: Plot = {
      ...polygonPlot,
      areaHectares: 4,
      areaSquareMeters: 40_000,
    };
    const required = resolveRequiredInwardFromBorderM(largePlot);
    expect(required).toBeGreaterThanOrEqual(5);
    const centroid = computePlotPhotoStandpoint(largePlot)!;
    expect(isPhotoStandpointReady(centroid.latitude, centroid.longitude, largePlot)).toBe(true);
    expect(
      isPhotoStandpointReady(
        largePlot.points[0].latitude,
        largePlot.points[0].longitude,
        largePlot,
      ),
    ).toBe(false);
  });

  it('waives inward standoff for plots under 4 ha', () => {
    expect(plotRequiresInwardPhotoStandoff(polygonPlot)).toBe(false);
    expect(resolveRequiredInwardFromBorderM(polygonPlot)).toBe(0);
    expect(isPhotoStandpointReady(14.1235, -87.1235, polygonPlot)).toBe(true);
    expect(isPhotoStandpointReady(14.123456, -87.123456, pointPlot)).toBe(true);
  });

  it('maps photos only by explicit direction tag (no index fallback)', () => {
    const photos = [
      photo({ plotId: 'p2', uri: 'a', takenAt: Date.now(), direction: null }),
      photo({ plotId: 'p2', uri: 'b', takenAt: Date.now(), direction: 'east' }),
    ];
    expect(photoForDirection(photos, 'north')).toBeUndefined();
    expect(photoForDirection(photos, 'east')?.uri).toBe('b');
  });

  it('requires four clearance-verified on-plot photos', () => {
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
    expect(isGroundTruthPhotoSetComplete(photos, polygonPlot)).toBe(true);
  });

  it('resolves next empty slot index', () => {
    const now = Date.now();
    const photos = [
      photo({
        plotId: polygonPlot.id,
        uri: 'a',
        takenAt: now,
        direction: 'north',
        latitude: 14.1235,
        longitude: -87.1235,
      }),
    ];
    expect(nextGroundTruthPhotoSlotIndex(photos, polygonPlot)).toBe(1);
  });

  it('computes heading delta toward cardinal targets', () => {
    expect(headingDeltaToDirection(350, 'north')).toBe(10);
    expect(headingDeltaToDirection(10, 'west')).toBe(-100);
  });
});
