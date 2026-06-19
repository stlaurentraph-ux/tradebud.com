/** Seconds to average GPS at each field corner (mark-corners mode). */
export const CORNER_CAPTURE_HOLD_SECONDS = 30;

export const CORNER_MIN_FOR_POLYGON = 3;

export type CornerCapturePhase = 'position' | 'settle' | 'save';

export function resolveCornerCapturePhase(params: {
  isRecording: boolean;
  holdPercent: number;
}): CornerCapturePhase {
  if (!params.isRecording) return 'position';
  if (params.holdPercent < 100) return 'settle';
  return 'save';
}

export function cornerProgressNumbers(savedCornerCount: number): {
  currentCorner: number;
  remainingToClose: number;
  shapeReady: boolean;
} {
  const currentCorner = savedCornerCount + 1;
  const remainingToClose = Math.max(0, CORNER_MIN_FOR_POLYGON - savedCornerCount);
  return {
    currentCorner,
    remainingToClose,
    shapeReady: savedCornerCount >= CORNER_MIN_FOR_POLYGON,
  };
}

export function canConfirmCornerSave(params: {
  isRecording: boolean;
  holdPercent: number;
}): boolean {
  if (!params.isRecording) return true;
  return params.holdPercent >= 100;
}

export function cornerMapOverlayMessageKey(phase: CornerCapturePhase): string {
  if (phase === 'settle') return 'walk_corner_tap_settling';
  return 'walk_corner_tap_ready';
}
