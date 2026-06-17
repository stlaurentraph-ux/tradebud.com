import type { TenantRole } from '@/types';

export const SUPPLY_CHAIN_ROLE_OPTIONS = [
  {
    id: 'cooperative',
    label: 'Cooperative',
    description: 'Member plots, field capture, consent, and cooperative governance.',
    tenantRole: 'cooperative' as const,
  },
  {
    id: 'exporter',
    label: 'Exporter / aggregator',
    description: 'Batch assembly, lineage integrity, and handoff-ready shipments.',
    tenantRole: 'exporter' as const,
  },
  {
    id: 'importer',
    label: 'Importer / EU operator',
    description: 'Verify upstream evidence and submit DDS to TRACES.',
    tenantRole: 'importer' as const,
  },
] as const;

export type SupplyChainRoleId = (typeof SUPPLY_CHAIN_ROLE_OPTIONS)[number]['id'];

/** Persisted in `supply_chain_roles` alongside cooperative / exporter / importer. */
export const INTEGRATED_HARVEST_CAPTURE_FLAG = 'integrated_harvest_capture' as const;
export const HIGH_RES_MAP_TILES_FLAG = 'high_res_map_tiles' as const;

export type SupplyChainWorkflowFlag =
  | typeof INTEGRATED_HARVEST_CAPTURE_FLAG
  | typeof HIGH_RES_MAP_TILES_FLAG;

export const SUPPLY_CHAIN_ROLE_PRESETS = [
  {
    id: 'cooperative_exporter',
    label: 'Cooperative + exporter',
    description: 'Member plots and export desk in one organisation.',
    roles: ['cooperative', 'exporter'] as const satisfies readonly SupplyChainRoleId[],
  },
  {
    id: 'brand',
    label: 'Vertically integrated brand',
    description: 'Origin aggregation and EU TRACES filing in one workspace.',
    roles: ['exporter', 'importer'] as const satisfies readonly SupplyChainRoleId[],
  },
  {
    id: 'cooperative_importer',
    label: 'Cooperative + EU market',
    description: 'Local member governance plus EU verification and filing.',
    roles: ['cooperative', 'importer'] as const satisfies readonly SupplyChainRoleId[],
  },
] as const;

export type SupplyChainRolePresetId = (typeof SUPPLY_CHAIN_ROLE_PRESETS)[number]['id'];

export function supplyChainRoleToTenantRole(roleId: SupplyChainRoleId): TenantRole {
  return SUPPLY_CHAIN_ROLE_OPTIONS.find((option) => option.id === roleId)?.tenantRole ?? 'exporter';
}

export function tenantRoleToSupplyChainRole(role: TenantRole): SupplyChainRoleId | null {
  if (role === 'cooperative' || role === 'exporter' || role === 'importer') {
    return role;
  }
  return null;
}

export function normalizeSupplyChainRoles(input: unknown): SupplyChainRoleId[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set(SUPPLY_CHAIN_ROLE_OPTIONS.map((option) => option.id));
  const unique = new Set<SupplyChainRoleId>();
  for (const value of input) {
    if (typeof value === 'string' && allowed.has(value as SupplyChainRoleId)) {
      unique.add(value as SupplyChainRoleId);
    }
  }
  return Array.from(unique);
}

export function tenantHasIntegratedHarvestCapture(
  profile: { supply_chain_roles?: unknown } | null | undefined,
  activeRole?: import('@/types').TenantRole,
): boolean {
  if (!Array.isArray(profile?.supply_chain_roles)) return false;
  if (profile.supply_chain_roles.includes(INTEGRATED_HARVEST_CAPTURE_FLAG)) {
    return true;
  }
  const roles = normalizeSupplyChainRoles(profile.supply_chain_roles);
  // Exporter desk may record harvests when the org also runs cooperative upstream capture.
  if (activeRole === 'exporter' && roles.includes('cooperative')) {
    return true;
  }
  return false;
}

export function resolveTenantRolesFromProfile(input: {
  primary_role?: string | null;
  supply_chain_roles?: unknown;
}): TenantRole[] {
  const explicit = normalizeSupplyChainRoles(input.supply_chain_roles).map(supplyChainRoleToTenantRole);
  if (explicit.length > 0) {
    return explicit;
  }

  const primary = input.primary_role?.trim() ?? '';
  if (primary === 'importer' || primary === 'compliance_manager') return ['importer'];
  if (primary === 'exporter') return ['exporter'];
  return ['exporter'];
}

export function describeSupplyChainRoleMix(roles: SupplyChainRoleId[]): string {
  if (roles.includes('cooperative') && roles.includes('exporter')) {
    return 'Integrated cooperative-exporter: capture upstream and prepare export shipments in one tenant.';
  }
  if (roles.includes('exporter') && roles.includes('importer')) {
    return 'Vertically integrated brand: operate origin aggregation and EU filing in one workspace (switch role in the sidebar).';
  }
  if (roles.includes('cooperative') && roles.includes('importer')) {
    return 'Cooperative with EU market access: manage members locally and verify/file EU shipments.';
  }
  if (roles.length === 1) {
    return SUPPLY_CHAIN_ROLE_OPTIONS.find((option) => option.id === roles[0])?.description ?? '';
  }
  return 'Multi-role organisation: use the sidebar role switcher to move between workflows.';
}

export function primaryTenantRoleFromSupplyChainRoles(roles: SupplyChainRoleId[]): TenantRole {
  if (roles.includes('importer')) return 'importer';
  if (roles.includes('exporter')) return 'exporter';
  if (roles.includes('cooperative')) return 'cooperative';
  return 'exporter';
}

export function defaultSupplyChainRoleForSignupPrimary(
  primaryRole: 'importer' | 'exporter' | 'cooperative' | 'compliance_manager' | 'admin' | '',
): SupplyChainRoleId {
  if (primaryRole === 'cooperative') return 'cooperative';
  if (primaryRole === 'importer' || primaryRole === 'compliance_manager') return 'importer';
  return 'exporter';
}

export function signupPrimarySupportsSupplyChainRoles(
  primaryRole: 'importer' | 'exporter' | 'cooperative' | 'compliance_manager' | 'admin' | '',
): boolean {
  return primaryRole === 'cooperative' || primaryRole === 'exporter' || primaryRole === 'importer';
}

export function ensurePrimaryInSupplyChainRoles(
  primaryRole: 'importer' | 'exporter' | 'cooperative' | 'compliance_manager' | 'admin' | '',
  current: SupplyChainRoleId[],
): SupplyChainRoleId[] {
  const primarySupplyRole = defaultSupplyChainRoleForSignupPrimary(primaryRole);
  if (current.includes(primarySupplyRole)) return current;
  return [primarySupplyRole, ...current];
}

export function toggleSupplyChainRoleSelection(
  current: SupplyChainRoleId[],
  roleId: SupplyChainRoleId,
): SupplyChainRoleId[] {
  if (current.includes(roleId)) {
    const next = current.filter((role) => role !== roleId);
    return next.length > 0 ? next : current;
  }
  return [...current, roleId];
}
