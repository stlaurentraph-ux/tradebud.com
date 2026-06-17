import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractHighResMapTilesFlag,
  maptilerApiKeyConfigured,
  plotMapAttribution,
  plotMapTileUrl,
  resolvePlotMapTileProvider,
} from './plot-map-tile-provider';

describe('plot-map-tile-provider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses Esri when MapTiler API key is not configured', () => {
    expect(resolvePlotMapTileProvider({ supply_chain_roles: ['exporter'] })).toBe('esri');
  });

  it('uses MapTiler for all tenants when API key is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_API_KEY', 'test-key');
    expect(resolvePlotMapTileProvider({ supply_chain_roles: ['exporter'] })).toBe('maptiler');
    expect(resolvePlotMapTileProvider(null)).toBe('maptiler');
  });

  it('falls back to Esri when API key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_API_KEY', '');
    expect(resolvePlotMapTileProvider({ supply_chain_roles: ['exporter'] })).toBe('esri');
  });

  it('builds provider-specific tile URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_API_KEY', 'abc123');
    expect(plotMapTileUrl('esri', 19, 42, 17)).toContain('arcgisonline.com');
    expect(plotMapTileUrl('maptiler', 19, 42, 17)).toContain('maptiler.com');
    expect(plotMapTileUrl('maptiler', 19, 42, 17)).toContain('abc123');
  });

  it('reads high-res flag from supply chain roles', () => {
    expect(extractHighResMapTilesFlag(['exporter', 'high_res_map_tiles'])).toBe(true);
    expect(extractHighResMapTilesFlag(['exporter'])).toBe(false);
  });

  it('reports attribution per provider', () => {
    expect(plotMapAttribution('esri')).toContain('Esri');
    expect(plotMapAttribution('maptiler')).toContain('MapTiler');
  });

  it('detects MapTiler API key configuration', () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_API_KEY', '  key  ');
    expect(maptilerApiKeyConfigured()).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_API_KEY', '   ');
    expect(maptilerApiKeyConfigured()).toBe(false);
  });
});
