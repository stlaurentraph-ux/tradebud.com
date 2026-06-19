import { describe, expect, it } from 'vitest';

import {
  boundaryStrokeCoordinates,
  isValidMapCoordinate,
  shouldShowStartMarker,
} from './plotBoundaryOverlayRender';

describe('plotBoundaryOverlayRender', () => {
  it('keeps an open chain by default while corners are being placed', () => {
    const open = boundaryStrokeCoordinates([
      { latitude: 14.1, longitude: -87.2 },
      { latitude: 14.101, longitude: -87.2 },
      { latitude: 14.101, longitude: -87.199 },
    ]);
    expect(open).toHaveLength(3);
  });

  it('can close the ring when explicitly requested', () => {
    const ring = boundaryStrokeCoordinates(
      [
        { latitude: 14.1, longitude: -87.2 },
        { latitude: 14.101, longitude: -87.2 },
        { latitude: 14.101, longitude: -87.199 },
      ],
      { closeRing: true },
    );
    expect(ring).toHaveLength(4);
    expect(ring[3]).toEqual(ring[0]);
  });

  it('rejects invalid coordinates', () => {
    expect(isValidMapCoordinate({ latitude: Number.NaN, longitude: 0 })).toBe(false);
    expect(
      boundaryStrokeCoordinates([
        { latitude: 14.1, longitude: -87.2 },
        { latitude: Number.NaN, longitude: -87.2 },
      ]),
    ).toEqual([]);
  });

  it('hides the start flag when numbered corner markers are shown', () => {
    expect(
      shouldShowStartMarker({
        showStartMarker: true,
        showVertexMarkers: true,
        vertexCount: 2,
      }),
    ).toBe(false);
    expect(
      shouldShowStartMarker({
        showStartMarker: true,
        showVertexMarkers: false,
        vertexCount: 2,
      }),
    ).toBe(true);
  });
});
