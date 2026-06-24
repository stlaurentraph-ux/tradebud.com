export type GeometryCaptureTier = 'high' | 'moderate' | 'low';

export type ShipmentGeometryAckMode = 'warn' | 'block';

export type TenantGeometryPolicy = {
  minTier: GeometryCaptureTier;
  ackMode: ShipmentGeometryAckMode;
};

export const DEFAULT_TENANT_GEOMETRY_POLICY: TenantGeometryPolicy = {
  minTier: 'moderate',
  ackMode: 'warn',
};

const TIER_RANK: Record<GeometryCaptureTier, number> = {
  low: 0,
  moderate: 1,
  high: 2,
};

export function parseGeometryCaptureTier(input: unknown): GeometryCaptureTier | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const tier = row.geometry_confidence_tier ?? row.geometryConfidenceTier;
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
    minTier:
      minTier === 'high' || minTier === 'moderate' || minTier === 'low'
        ? minTier
        : DEFAULT_TENANT_GEOMETRY_POLICY.minTier,
    ackMode: ackMode === 'block' ? 'block' : 'warn',
  };
}

export function plotGeometryNeedsShipmentAck(input: {
  geometryApprovedAt: string | null;
  captureTier: GeometryCaptureTier | null;
  policy: TenantGeometryPolicy;
}): { severity: 'blocker' | 'warning' } | null {
  if (input.geometryApprovedAt?.trim()) return null;
  const tier = input.captureTier ?? 'low';
  if (TIER_RANK[tier] >= TIER_RANK[input.policy.minTier]) {
    return null;
  }
  return {
    severity: input.policy.ackMode === 'block' ? 'blocker' : 'warning',
  };
}
