export type GeometryCaptureTier = 'high' | 'moderate' | 'low' | null;

export type TenantGeometryPolicy = {
  geometrySyncMinTier: GeometryCaptureTier;
  shipmentGeometryAckMode: 'required' | 'recommended' | 'none';
};

export const DEFAULT_TENANT_GEOMETRY_POLICY: TenantGeometryPolicy = {
  geometrySyncMinTier: null,
  shipmentGeometryAckMode: 'recommended',
};

/**
 * Extracts the geometry confidence tier from a `geometry_capture` JSONB column value.
 * Returns null when the payload is absent or malformed.
 */
export function parseGeometryCaptureTier(raw: unknown): GeometryCaptureTier {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const tier = row.geometry_confidence_tier ?? row.geometryConfidenceTier;
  if (tier === 'high' || tier === 'moderate' || tier === 'low') return tier;
  return null;
}

/**
 * Maps a `tenant_geometry_policy` DB row to the typed policy object.
 * Unknown enum values fall back to the permissive default.
 */
export function parseTenantGeometryPolicyRow(row: {
  geometry_sync_min_tier: string;
  shipment_geometry_ack_mode: string;
}): TenantGeometryPolicy {
  const rawTier = row.geometry_sync_min_tier;
  const geometrySyncMinTier: GeometryCaptureTier =
    rawTier === 'high' || rawTier === 'moderate' || rawTier === 'low' ? rawTier : null;

  const rawMode = row.shipment_geometry_ack_mode;
  const shipmentGeometryAckMode: TenantGeometryPolicy['shipmentGeometryAckMode'] =
    rawMode === 'required' || rawMode === 'recommended' || rawMode === 'none'
      ? rawMode
      : 'recommended';

  return { geometrySyncMinTier, shipmentGeometryAckMode };
}

/**
 * Determines whether a plot's geometry requires an explicit shipment acknowledgment.
 *
 * Returns null when no ack is needed, or an object with the appropriate severity:
 *  - 'blocker'  → package cannot proceed until geometry is approved
 *  - 'warning'  → geometry confidence is low / approval is recommended
 */
export function plotGeometryNeedsShipmentAck(params: {
  geometryApprovedAt: string | null;
  captureTier: GeometryCaptureTier;
  policy: TenantGeometryPolicy;
}): { severity: 'blocker' | 'warning' } | null {
  const { geometryApprovedAt, captureTier, policy } = params;

  if (policy.shipmentGeometryAckMode === 'none') return null;
  if (geometryApprovedAt) return null;

  if (policy.shipmentGeometryAckMode === 'required') {
    return { severity: 'blocker' };
  }

  // 'recommended' mode: warn when capture confidence is low or absent
  if (captureTier === 'low' || captureTier === null) {
    return { severity: 'warning' };
  }

  if (captureTier === 'moderate' && policy.geometrySyncMinTier === 'high') {
    return { severity: 'warning' };
  }

  return null;
}
