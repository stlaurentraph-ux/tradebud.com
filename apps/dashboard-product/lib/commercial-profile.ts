import type { TenantRole } from '@/types';

export interface CommercialProfile {
  tenant_id: string;
  organization_name: string | null;
  country: string | null;
  primary_role: string | null;
  team_size: string | null;
  main_commodity: string | null;
  primary_objective: string | null;
  profile_skipped: boolean;
  updated_at: string;
}

export function isWorkspaceSetupComplete(profile: CommercialProfile | null | undefined): boolean {
  if (!profile) return false;
  const organizationName = profile.organization_name?.trim() ?? '';
  const country = profile.country?.trim() ?? '';
  const primaryRole = profile.primary_role?.trim() ?? '';
  return organizationName.length > 0 && country.length > 0 && primaryRole.length > 0;
}

export function commercialPrimaryRoleToTenantRole(
  primaryRole: string | null | undefined,
): TenantRole {
  if (primaryRole === 'importer') return 'importer';
  if (primaryRole === 'compliance_manager') return 'importer';
  return 'exporter';
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
