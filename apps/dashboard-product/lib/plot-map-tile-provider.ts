import type { CommercialProfile } from '@/lib/commercial-profile';
import { ESRI_WORLD_IMAGERY_TILE_URL } from '@/lib/plot-map-preview-geometry';
import { HIGH_RES_MAP_TILES_FLAG } from '@/lib/org-supply-chain-roles';

export type PlotMapTileProviderId = 'esri' | 'maptiler';

export function extractHighResMapTilesFlag(supplyChainRoles: unknown): boolean {
  if (!Array.isArray(supplyChainRoles)) return false;
  return supplyChainRoles.includes(HIGH_RES_MAP_TILES_FLAG);
}

export function maptilerApiKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim());
}

export function resolvePlotMapTileProvider(
  _profile?: Pick<CommercialProfile, 'supply_chain_roles'> | null | undefined,
): PlotMapTileProviderId {
  return maptilerApiKeyConfigured() ? 'maptiler' : 'esri';
}

export function plotMapTileUrl(
  provider: PlotMapTileProviderId,
  zoom: number,
  tileY: number,
  tileX: number,
): string {
  if (provider === 'maptiler') {
    const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ?? '';
    return `https://api.maptiler.com/tiles/satellite-v2/${zoom}/${tileX}/${tileY}.jpg?key=${encodeURIComponent(key)}`;
  }
  return `${ESRI_WORLD_IMAGERY_TILE_URL}/${zoom}/${tileY}/${tileX}`;
}

export function plotMapAttribution(provider: PlotMapTileProviderId): string {
  if (provider === 'maptiler') return 'MapTiler Satellite';
  return 'Esri World Imagery';
}
