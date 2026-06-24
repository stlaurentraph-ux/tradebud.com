import { normalizePlotGeometryCaptureInput } from './plot-geometry-capture';

export type GeometrySyncMinTier = 'high' | 'moderate' | 'low';
export type ShipmentGeometryAckMode = 'off' | 'warn' | 'block';

export type TenantGeometryPolicy = {
  geometrySyncMinTier: GeometrySyncMinTier;
  shipmentGeometryAckMode: ShipmentGeometryAckMode;
};

export const DEFAULT_TENANT_GEOMETRY_POLICY: TenantGeometryPolicy = {
  geometrySyncMinTier: 'low',
  shipmentGeometryAckMode: 'off',
};

const TIER_RANK: Record<GeometrySyncMinTier, number> = {
  low: 0,
  moderate: 1,
  high: 2,
};

export function parseGeometryCaptureTier(
  rawCapture: unknown,
): GeometrySyncMinTier | null {
  const payload = normalizePlotGeometryCaptureInput(rawCapture);
  if (!payload) return null;
  const tier = payload.geometry_confidence_tier;
  if (tier === 'high' || tier === 'moderate' || tier === 'low') return tier;
  return null;
}

export function parseTenantGeometryPolicyRow(row: {
  geometry_sync_min_tier: string;
  shipment_geometry_ack_mode: string;
}): TenantGeometryPolicy {
  const minTier: GeometrySyncMinTier =
    row.geometry_sync_min_tier === 'high'
      ? 'high'
      : row.geometry_sync_min_tier === 'moderate'
        ? 'moderate'
        : 'low';

  const ackMode: ShipmentGeometryAckMode =
    row.shipment_geometry_ack_mode === 'block'
      ? 'block'
      : row.shipment_geometry_ack_mode === 'warn'
        ? 'warn'
        : 'off';

  return { geometrySyncMinTier: minTier, shipmentGeometryAckMode: ackMode };
}

export function plotGeometryNeedsShipmentAck(params: {
  geometryApprovedAt: string | null | undefined;
  captureTier: GeometrySyncMinTier | null;
  policy: TenantGeometryPolicy;
}): { severity: 'blocker' | 'warning' } | null {
  const { geometryApprovedAt, captureTier, policy } = params;

  if (policy.shipmentGeometryAckMode === 'off') {
    return null;
  }

  if (geometryApprovedAt) {
    return null;
  }

  const tierRank = captureTier != null ? TIER_RANK[captureTier] : -1;
  const minRank = TIER_RANK[policy.geometrySyncMinTier];

  if (tierRank >= minRank) {
    return null;
  }

  const severity =
    policy.shipmentGeometryAckMode === 'block' ? 'blocker' : 'warning';
  return { severity };
}
