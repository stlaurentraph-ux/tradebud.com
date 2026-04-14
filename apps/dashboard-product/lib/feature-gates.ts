type FeatureGateKey =
  | 'request_campaigns'
  | 'annual_reporting';

interface FeatureGateConfig {
  key: FeatureGateKey;
  envVar: string;
  defaultEnabled: boolean;
  owner: string;
  deferredReason: string;
  routes: string[];
}

const FEATURE_GATE_CONFIG: readonly FeatureGateConfig[] = [
  {
    key: 'request_campaigns',
    envVar: 'NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS',
    defaultEnabled: false,
    owner: 'Dashboard + Product Eng',
    deferredReason: 'Request campaign workflows are Release 2+ and out of MVP scope.',
    routes: ['/requests'],
  },
  {
    key: 'annual_reporting',
    envVar: 'NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING',
    defaultEnabled: false,
    owner: 'Dashboard + Product Eng',
    deferredReason: 'Annual reporting snapshots are Release 4 scope.',
    routes: ['/reports'],
  },
] as const;

export function isFeatureEnabled(key: FeatureGateKey): boolean {
  const gate = FEATURE_GATE_CONFIG.find((item) => item.key === key);
  if (!gate) return false;
  const value = process.env[gate.envVar];
  if (!value) return gate.defaultEnabled;
  return value === '1' || value.toLowerCase() === 'true';
}

export function isRouteEnabled(pathname: string): boolean {
  return getDeferredGateForPath(pathname) === null;
}

export function getDeferredGateForPath(pathname: string): FeatureGateKey | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  for (const gate of FEATURE_GATE_CONFIG) {
    const disabled = !isFeatureEnabled(gate.key);
    if (!disabled) continue;
    if (gate.routes.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`))) {
      return gate.key;
    }
  }
  return null;
}

export function getFeatureGateConfig(): readonly FeatureGateConfig[] {
  return FEATURE_GATE_CONFIG;
}
