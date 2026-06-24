import type { PlotGeometryCapturePayload } from './plot-geometry-capture';

export type GeometryCaptureTier = PlotGeometryCapturePayload['geometry_confidence_tier'];

export interface TenantGeometryPolicy {
  geometrySyncMinTier: GeometryCaptureTier;
  shipmentGeometryAckMode: 'required' | 'recommended' | 'off';
}

export const DEFAULT_TENANT_GEOMETRY_POLICY: TenantGeometryPolicy = {
  geometrySyncMinTier: 'low',
  shipmentGeometryAckMode: 'recommended',
};

export function parseGeometryCaptureTier(capturePayload: unknown): GeometryCaptureTier | null {
  if (!capturePayload || typeof capturePayload !== 'object') return null;
  const tier = (capturePayload as Record<string, unknown>).geometry_confidence_tier;
  if (tier === 'high' || tier === 'moderate' || tier === 'low') return tier;
  return null;
}

export function parseTenantGeometryPolicyRow(row: {
  geometry_sync_min_tier: string;
  shipment_geometry_ack_mode: string;
}): TenantGeometryPolicy {
  const minTier = row.geometry_sync_min_tier;
  const ackMode = row.shipment_geometry_ack_mode;
  return {
    geometrySyncMinTier:
      minTier === 'high' || minTier === 'moderate' || minTier === 'low' ? minTier : 'low',
    shipmentGeometryAckMode:
      ackMode === 'required' || ackMode === 'recommended' || ackMode === 'off'
        ? ackMode
        : 'recommended',
  };
}

export function plotGeometryNeedsShipmentAck(params: {
  geometryApprovedAt: string | null | undefined;
  captureTier: GeometryCaptureTier | null | undefined;
  policy: TenantGeometryPolicy;
}): { severity: 'blocker' | 'warning' } | null {
  const { geometryApprovedAt, captureTier, policy } = params;

  if (geometryApprovedAt) return null;
  if (policy.shipmentGeometryAckMode === 'off') return null;
  if (!captureTier || captureTier === 'high') return null;

  if (captureTier === 'low') {
    return {
      severity: policy.shipmentGeometryAckMode === 'required' ? 'blocker' : 'warning',
    };
  }

  return { severity: 'warning' };
}
