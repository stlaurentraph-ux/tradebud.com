import type { TenantRole } from '@/types';
import type { LaunchCommercialProfile as OpenApiLaunchCommercialProfile } from '@/lib/openapi-proxy-types';
import {
  normalizeSupplyChainRoles,
  primaryTenantRoleFromSupplyChainRoles,
  resolveTenantRolesFromProfile,
} from '@/lib/org-supply-chain-roles';

export type CommercialProfile = OpenApiLaunchCommercialProfile & {
  supply_chain_roles?: string[] | null;
};

export function isWorkspaceSetupComplete(profile: CommercialProfile | null | undefined): boolean {
  if (!profile) return false;
  const organizationName = profile.organization_name?.trim() ?? '';
  const country = profile.country?.trim() ?? '';
  const primaryRole = profile.primary_role?.trim() ?? '';
  const supplyRoles = normalizeSupplyChainRoles(profile.supply_chain_roles);
  return organizationName.length > 0 && country.length > 0 && (primaryRole.length > 0 || supplyRoles.length > 0);
}

export function commercialPrimaryRoleToTenantRole(
  primaryRole: string | null | undefined,
): TenantRole {
  if (primaryRole === 'importer') return 'importer';
  if (primaryRole === 'compliance_manager') return 'importer';
  return 'exporter';
}

export function resolveProfileTenantRoles(profile: CommercialProfile | null | undefined): TenantRole[] {
  if (!profile) return ['exporter'];
  return resolveTenantRolesFromProfile(profile);
}

export function defaultActiveRoleForProfile(profile: CommercialProfile | null | undefined): TenantRole {
  const roles = resolveProfileTenantRoles(profile);
  const explicit = normalizeSupplyChainRoles(profile?.supply_chain_roles);
  if (explicit.length > 0) {
    return primaryTenantRoleFromSupplyChainRoles(explicit);
  }
  return roles[0] ?? 'exporter';
}

export async function fetchCommercialProfile(): Promise<CommercialProfile | null> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  if (!token) return null;

  const response = await fetch('/api/launch/commercial-profile', {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const payload = (await response.json().catch(() => ({}))) as { profile?: CommercialProfile | null };
  return payload.profile ?? null;
}
