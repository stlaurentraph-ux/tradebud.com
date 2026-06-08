import type { TenantRole } from '@/types';

export type HarvestPackageScope = 'tenant' | 'shared';

export function resolveHarvestPackageScope(activeRole?: TenantRole | null): HarvestPackageScope {
  if (activeRole === 'importer' || activeRole === 'country_reviewer') {
    return 'shared';
  }
  return 'tenant';
}

export type PackagesPageTab = 'my' | 'shared';

export function defaultPackagesPageTab(activeRole?: TenantRole | null): PackagesPageTab {
  if (activeRole === 'importer' || activeRole === 'country_reviewer') {
    return 'shared';
  }
  return 'my';
}
