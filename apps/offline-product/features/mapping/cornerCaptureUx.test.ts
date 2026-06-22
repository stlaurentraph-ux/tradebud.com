import { describe, expect, it } from 'vitest';

import {
  canConfirmCornerSave,
  cornerMapOverlayMessageKey,
  cornerProgressNumbers,
  resolveCornerCaptureLiveMessage,
  resolveCornerCapturePhase,
} from './cornerCaptureUx';

describe('cornerCaptureUx', () => {
  it('resolves capture phases', () => {
    expect(resolveCornerCapturePhase({ isRecording: false, holdPercent: 0 })).toBe('position');
    expect(resolveCornerCapturePhase({ isRecording: true, holdPercent: 40 })).toBe('settle');
    expect(resolveCornerCapturePhase({ isRecording: true, holdPercent: 100 })).toBe('save');
  });

  it('tracks how many corners remain to close the shape', () => {
    expect(cornerProgressNumbers(0)).toEqual({
      currentCorner: 1,
      remainingToClose: 3,
      shapeReady: false,
    });
    expect(cornerProgressNumbers(2)).toEqual({
      currentCorner: 3,
      remainingToClose: 1,
      shapeReady: false,
    });
    expect(cornerProgressNumbers(3).shapeReady).toBe(true);
  });

  it('only allows save after hold completes', () => {
    expect(canConfirmCornerSave({ isRecording: false, holdPercent: 0 })).toBe(true);
    expect(canConfirmCornerSave({ isRecording: true, holdPercent: 50 })).toBe(false);
    expect(canConfirmCornerSave({ isRecording: true, holdPercent: 100 })).toBe(true);
  });

  it('picks overlay copy per phase', () => {
    expect(cornerMapOverlayMessageKey('settle')).toBe('walk_corner_tap_settling');
    expect(cornerMapOverlayMessageKey('save')).toBe('walk_corner_tap_ready');
  });

  it('resolves live guidance for map banner and footer hint', () => {
    expect(
      resolveCornerCaptureLiveMessage({
        isRecording: false,
        holdPercent: 0,
        savedCornerCount: 0,
        secondsRemaining: 30,
        poorGps: false,
      }),
    ).toEqual({ key: 'walk_corner_map_empty' });

    expect(
      resolveCornerCaptureLiveMessage({
        isRecording: true,
        holdPercent: 40,
        savedCornerCount: 1,
        secondsRemaining: 18,
        poorGps: false,
      }),
    ).toEqual({ key: 'walk_corner_hold_progress', params: { seconds: 18 } });

    expect(
      resolveCornerCaptureLiveMessage({
        isRecording: true,
        holdPercent: 100,
        savedCornerCount: 2,
        secondsRemaining: 0,
        poorGps: false,
      }),
    ).toEqual({ key: 'walk_corner_tap_ready' });
  });
});
