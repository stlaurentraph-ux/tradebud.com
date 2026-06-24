import type { TenantRole } from '@/types';
import {
  normalizePlotGeometryCapture,
  type PlotGeometryCaptureRecord,
} from '@/lib/plot-geometry-capture';

export type PlotGeometryApprovalState = {
  geometryApprovedAt: string | null;
  capture: PlotGeometryCaptureRecord | null;
};

/** Backend JWT roles allowed to POST approve-geometry (see backendApiAccessRegistry plots_approve_geometry). */
const APPROVAL_ROLES = new Set<string>([
  'exporter',
  'compliance_manager',
  'country_reviewer',
  'admin',
]);

export function canApprovePlotGeometry(role: TenantRole | string | null | undefined): boolean {
  if (!role) return false;
  return APPROVAL_ROLES.has(role);
}

export function plotGeometryApprovalRecommended(capture: PlotGeometryCaptureRecord | null): boolean {
  const tier = capture?.geometryConfidenceTier;
  return tier === 'low' || tier === 'moderate';
}

export function normalizePlotGeometryApprovalState(input: {
  geometry_approved_at?: unknown;
  geometryApprovedAt?: unknown;
  geometry_capture?: unknown;
  geometryCapture?: unknown;
}): PlotGeometryApprovalState {
  const approvedRaw = input.geometry_approved_at ?? input.geometryApprovedAt;
  const geometryApprovedAt =
    typeof approvedRaw === 'string' && approvedRaw.trim().length > 0 ? approvedRaw : null;
  const captureRaw = input.geometry_capture ?? input.geometryCapture;
  return {
    geometryApprovedAt,
    capture: normalizePlotGeometryCapture(captureRaw),
  };
}
