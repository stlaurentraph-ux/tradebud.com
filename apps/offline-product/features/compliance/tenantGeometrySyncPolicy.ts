import { getSetting, setSetting } from '@/features/state/persistence';

import type { GeometryConfidenceTier } from './plotGeometryConfidence';

export type GeometrySyncMinTier = GeometryConfidenceTier;

const STORAGE_KEY = 'tenant_geometry_sync_min_tier';

export const DEFAULT_GEOMETRY_SYNC_MIN_TIER: GeometrySyncMinTier = 'moderate';

function parseTier(value: string | null | undefined): GeometrySyncMinTier | null {
  const tier = value?.trim();
  if (tier === 'high' || tier === 'moderate' || tier === 'low') return tier;
  return null;
}

export async function loadGeometrySyncMinTier(): Promise<GeometrySyncMinTier> {
  return parseTier(await getSetting(STORAGE_KEY)) ?? DEFAULT_GEOMETRY_SYNC_MIN_TIER;
}

/** Persist cooperative minimum geometry confidence tier from field-sync delta. */
export async function persistGeometrySyncMinTier(tier: GeometrySyncMinTier): Promise<void> {
  await setSetting(STORAGE_KEY, tier);
}
