import { describe, expect, it } from 'vitest';

import {
  hasUnsavedMappingProgress,
  plotBoundaryPointsChanged,
} from './mappingProgress';

describe('mappingDiscardConfirm', () => {
  it('detects unchanged edit boundary', () => {
    const points = [
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ];
    expect(
      hasUnsavedMappingProgress({
        isRecording: false,
        drawTracingActive: false,
        pointCount: points.length,
        originalPoints: points,
        currentPoints: points,
      }),
    ).toBe(false);
  });

  it('detects active recording', () => {
    expect(
      hasUnsavedMappingProgress({
        isRecording: true,
        drawTracingActive: false,
        pointCount: 0,
        currentPoints: [],
      }),
    ).toBe(true);
  });

  it('detects new capture points', () => {
    expect(
      hasUnsavedMappingProgress({
        isRecording: false,
        drawTracingActive: false,
        pointCount: 1,
        currentPoints: [{ latitude: 1, longitude: 2 }],
      }),
    ).toBe(true);
  });

  it('detects edited boundary vertices', () => {
    const original = [{ latitude: 1, longitude: 2 }];
    const current = [{ latitude: 1.01, longitude: 2 }];
    expect(plotBoundaryPointsChanged(original, current)).toBe(true);
  });
});
