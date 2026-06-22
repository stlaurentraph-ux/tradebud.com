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

export type CornerCaptureLiveMessage = {
  key: string;
  params?: Record<string, string | number>;
};

/** Shared live guidance for mark-corners map banner and footer hint. */
export function resolveCornerCaptureLiveMessage(params: {
  isRecording: boolean;
  holdPercent: number;
  savedCornerCount: number;
  secondsRemaining: number;
  poorGps: boolean;
}): CornerCaptureLiveMessage {
  const progress = cornerProgressNumbers(params.savedCornerCount);

  if (params.isRecording) {
    if (params.holdPercent >= 100) {
      return { key: 'walk_corner_tap_ready' };
    }
    if (params.poorGps) {
      return { key: 'walk_tip_recording_phone' };
    }
    return { key: 'walk_corner_hold_progress', params: { seconds: params.secondsRemaining } };
  }

  if (progress.shapeReady) {
    return { key: 'walk_corner_progress_ready', params: { n: params.savedCornerCount } };
  }

  if (params.savedCornerCount > 0) {
    return {
      key: 'walk_corner_progress_chip',
      params: { n: params.savedCornerCount, remaining: progress.remainingToClose },
    };
  }

  return { key: 'walk_corner_map_empty' };
}
