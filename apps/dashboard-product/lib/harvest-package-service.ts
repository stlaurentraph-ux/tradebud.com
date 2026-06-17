import {
  mapBackendPackageDetailToDdsPackage,
  mapBackendPackagesResponse,
  type BackendPackageDetail,
} from '@/lib/harvest-package-mapper';
import type { DDSPackage } from '@/types';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function findPackageInList(packages: DDSPackage[], lookupId: string): DDSPackage | null {
  const normalized = lookupId.trim();
  if (!normalized) return null;
  return (
    packages.find((pkg) => pkg.id === normalized) ??
    packages.find((pkg) => pkg.code === normalized) ??
    null
  );
}

async function fetchPackageList(fallbackTenantId: string): Promise<DDSPackage[]> {
  const response = await fetch('/api/harvest/packages?scope=tenant', {
    method: 'GET',
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json().catch(() => ({}))) as { packages?: unknown };
  return mapBackendPackagesResponse(body.packages ?? body, fallbackTenantId);
}

export type HarvestPackageDetailResult = {
  pkg: DDSPackage;
  vouchers: BackendPackageDetail['vouchers'];
  resolvedFromListFallback: boolean;
};

export async function getHarvestPackageById(
  lookupId: string,
  fallbackTenantId: string,
): Promise<HarvestPackageDetailResult | null> {
  const normalized = lookupId.trim();
  if (!normalized) return null;

  const detailResponse = await fetch(
    `/api/harvest/packages/${encodeURIComponent(normalized)}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: getAuthHeaders(),
    },
  );

  if (detailResponse.ok) {
    const body = (await detailResponse.json().catch(() => ({}))) as {
      package?: BackendPackageDetail['package'];
      vouchers?: BackendPackageDetail['vouchers'];
    };
    if (body.package?.id) {
      const detailVouchers = body.vouchers ?? [];
      const mapped = mapBackendPackageDetailToDdsPackage(
        { package: body.package, vouchers: detailVouchers },
        fallbackTenantId,
      );
      return { pkg: mapped, vouchers: detailVouchers, resolvedFromListFallback: false };
    }
  }

  const packages = await fetchPackageList(fallbackTenantId);
  const fromList = findPackageInList(packages, normalized);
  if (!fromList) {
    return null;
  }

  return { pkg: fromList, vouchers: [], resolvedFromListFallback: true };
}
