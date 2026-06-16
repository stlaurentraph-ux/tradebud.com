import { describe, expect, it } from 'vitest';

import { resolveYouPosition } from './plotBoundaryOverlayLogic';

describe('resolveYouPosition', () => {
  const trail = [
    { latitude: 1, longitude: 1 },
    { latitude: 2, longitude: 2 },
  ];
  const user = { latitude: 3, longitude: 3 };
  const vertices = [
    { latitude: 4, longitude: 4 },
    { latitude: 5, longitude: 5 },
  ];

  it('prefers the live GPS trail while recording', () => {
    expect(resolveYouPosition({ liveTrail: trail, userPosition: user, vertices })).toEqual(trail[1]);
  });

  it('shows idle user position before recording starts', () => {
    expect(resolveYouPosition({ liveTrail: [], userPosition: user, vertices: [] })).toEqual(user);
  });

  it('falls back to the last vertex when no trail or preview position', () => {
    expect(resolveYouPosition({ liveTrail: [], vertices })).toEqual(vertices[1]);
  });

  it('returns null when nothing is available', () => {
    expect(resolveYouPosition({ liveTrail: [], vertices: [] })).toBeNull();
  });
});
