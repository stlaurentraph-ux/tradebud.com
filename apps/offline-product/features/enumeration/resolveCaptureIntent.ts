import type { PlotGeometryCaptureIntent } from '@/features/compliance/plotGeometryCapture';

export type CaptureIntentInput = {
  kind: 'point' | 'polygon';
  captureMethod: 'walk' | 'pin' | 'draw' | 'centroid';
  declaredAreaHa?: number | null;
};

/** EUDR floor vs cooperative full-boundary ambition (ADR-011). */
export function resolveCaptureIntent(params: CaptureIntentInput): PlotGeometryCaptureIntent {
  if (params.kind === 'point' || params.captureMethod === 'pin') {
    return 'eudr_minimum';
  }

  if (params.kind === 'polygon') {
    return 'full_boundary';
  }

  return 'eudr_minimum';
}
