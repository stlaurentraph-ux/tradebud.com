/**
 * Maps current marketing routes (stealth + v0 styling) to the June 2026 definition target IA.
 * See TRACEBUD_DEFINITION_JUNE_2026.md
 */

export type RouteMigration = {
  currentPath: string;
  targetPath: string;
  action: 'keep' | 'rename-at-launch' | 'merge' | 'new' | 'deprecate';
  notes?: string;
};

/** Current → target paths. v0 branch `v0/stlaurentraph-4260-3ace7b2a` may add pages not listed here. */
export const marketingRouteMigration: RouteMigration[] = [
  // Home
  { currentPath: '/', targetPath: '/', action: 'keep' },
  { currentPath: '/preview', targetPath: '/', action: 'merge', notes: 'Home v2 sections mount on / at Stage B' },

  // Platform
  { currentPath: '/platform', targetPath: '/platform', action: 'keep', notes: 'Hub reframes as Field App + Dashboard' },
  { currentPath: '/platform/offline-mapping', targetPath: '/platform/field-app', action: 'merge' },
  { currentPath: '/platform/ai-verification', targetPath: '/platform/field-app', action: 'merge', notes: 'Verification story moves under Field App + EUDR solution' },
  { currentPath: '/platform/network', targetPath: '/resources/data-sovereignty-security', action: 'merge' },
  { currentPath: '/platform/integrations', targetPath: '/resources/api-docs', action: 'merge' },
  { currentPath: '/platform/field-app', targetPath: '/platform/field-app', action: 'new' },
  { currentPath: '/platform/dashboard', targetPath: '/platform/dashboard', action: 'new' },

  // Solutions (modular products)
  { currentPath: '/compliance', targetPath: '/solutions/eudr-compliance', action: 'rename-at-launch' },
  { currentPath: '/compliance/eudr', targetPath: '/solutions/eudr-compliance', action: 'rename-at-launch' },
  { currentPath: '/compliance/due-diligence', targetPath: '/solutions/eudr-compliance', action: 'merge' },
  { currentPath: '/compliance/guides', targetPath: '/resources/insights', action: 'merge' },
  { currentPath: '/compliance/security', targetPath: '/resources/data-sovereignty-security', action: 'merge' },
  { currentPath: '/solutions', targetPath: '/solutions', action: 'new' },
  { currentPath: '/solutions/esg-carbon-reporting', targetPath: '/solutions/esg-carbon-reporting', action: 'new' },
  { currentPath: '/solutions/regenerative-agriculture', targetPath: '/solutions/regenerative-agriculture', action: 'new' },
  { currentPath: '/solutions/child-labor-monitoring', targetPath: '/solutions/child-labor-monitoring', action: 'new' },
  { currentPath: '/solutions/open-chain-model', targetPath: '/solutions/open-chain-model', action: 'new' },
  { currentPath: '/solutions/direct-trade-marketplace', targetPath: '/solutions/direct-trade-marketplace', action: 'new' },

  // Who we serve (personas)
  { currentPath: '/farmers', targetPath: '/who-we-serve/producers-cooperatives', action: 'rename-at-launch' },
  { currentPath: '/cooperatives', targetPath: '/who-we-serve/producers-cooperatives', action: 'merge' },
  { currentPath: '/exporters', targetPath: '/who-we-serve/exporters-processors', action: 'rename-at-launch' },
  { currentPath: '/importers', targetPath: '/who-we-serve/brands-roasters', action: 'rename-at-launch' },
  { currentPath: '/sponsors', targetPath: '/who-we-serve/sponsors', action: 'rename-at-launch' },
  { currentPath: '/countries', targetPath: '/who-we-serve/countries', action: 'rename-at-launch' },
  { currentPath: '/why-tracebud', targetPath: '/outcomes/resilient-supply-chains', action: 'merge', notes: 'Principles also on home + outcomes' },

  // Outcomes (was Impact in stealth IA)
  { currentPath: '/impact', targetPath: '/outcomes', action: 'rename-at-launch' },
  { currentPath: '/impact/farmer-livelihood', targetPath: '/outcomes/farmer-livelihoods', action: 'rename-at-launch' },
  { currentPath: '/impact/smallholders', targetPath: '/outcomes/farmer-livelihoods', action: 'merge', notes: 'v0 branch page' },
  { currentPath: '/impact/regenerative-farming', targetPath: '/solutions/regenerative-agriculture', action: 'merge' },
  { currentPath: '/impact/supply-chains', targetPath: '/outcomes/resilient-supply-chains', action: 'rename-at-launch', notes: 'v0 branch page' },
  { currentPath: '/impact/climate-biodiversity', targetPath: '/outcomes/nature-positive-climate', action: 'rename-at-launch' },
  { currentPath: '/impact/forests', targetPath: '/outcomes/nature-positive-climate', action: 'merge', notes: 'v0 branch page' },

  // Resources
  { currentPath: '/insights', targetPath: '/resources/insights', action: 'rename-at-launch' },
  { currentPath: '/resources', targetPath: '/resources', action: 'new' },

  // Convert
  { currentPath: '/pricing', targetPath: '/pricing', action: 'keep', notes: 'Update copy to modular pricing matrix when approved' },
  { currentPath: '/get-started', targetPath: '/get-started', action: 'keep' },
  { currentPath: '/pilot', targetPath: '/pilot', action: 'keep' },
  { currentPath: '/demo', targetPath: '/demo', action: 'keep' },

  // Meta
  { currentPath: '/draft', targetPath: '/draft', action: 'deprecate', notes: 'Internal only; remove at launch' },
];

export function getMigrationForPath(path: string): RouteMigration | undefined {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return marketingRouteMigration.find((entry) => entry.currentPath === normalized);
}
