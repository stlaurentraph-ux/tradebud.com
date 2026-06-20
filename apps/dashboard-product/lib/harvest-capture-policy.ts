import type { TenantRole, User } from '@/types';
import type { CommercialProfile } from '@/lib/commercial-profile';
import { hasPermission } from '@/lib/rbac';
import {
  INTEGRATED_HARVEST_CAPTURE_FLAG,
  normalizeSupplyChainRoles,
  tenantHasIntegratedHarvestCapture,
} from '@/lib/org-supply-chain-roles';

export { tenantHasIntegratedHarvestCapture };

const VOUCHER_FIRST_INTAKE_ROLES: TenantRole[] = ['cooperative', 'exporter'];

export function usesVoucherFirstHarvestIntake(role: TenantRole | null | undefined): boolean {
  return role != null && VOUCHER_FIRST_INTAKE_ROLES.includes(role);
}

export function canCreateHarvestBatch(
  user: User | null | undefined,
  profile: Pick<CommercialProfile, 'supply_chain_roles'> | null | undefined,
): boolean {
  if (!user) return false;

  if (user.active_role === 'cooperative' || user.active_role === 'exporter') {
    return tenantHasIntegratedHarvestCapture(profile, user.active_role);
  }

  return hasPermission(user, 'harvests:create');
}

export function canEditHarvestBatch(
  user: User | null | undefined,
  profile: Pick<CommercialProfile, 'supply_chain_roles'> | null | undefined,
): boolean {
  if (!user) return false;

  if (user.active_role === 'cooperative' || user.active_role === 'exporter') {
    return tenantHasIntegratedHarvestCapture(profile, user.active_role);
  }

  return hasPermission(user, 'harvests:edit');
}

export function extractIntegratedHarvestCaptureFlag(supplyChainRoles: unknown): boolean {
  if (!Array.isArray(supplyChainRoles)) return false;
  return supplyChainRoles.includes(INTEGRATED_HARVEST_CAPTURE_FLAG);
}

export function mergeSupplyChainRolesForSave(
  roles: unknown,
  options: boolean | { integratedHarvestCapture?: boolean },
): string[] {
  const integratedHarvestCapture =
    typeof options === 'boolean' ? options : (options.integratedHarvestCapture ?? false);

  const normalized = normalizeSupplyChainRoles(roles);
  let result: string[] = normalized;
  if (integratedHarvestCapture) {
    if (!(normalized.includes('cooperative') && normalized.includes('exporter'))) {
      result = [...result, INTEGRATED_HARVEST_CAPTURE_FLAG];
    }
  }
  return result;
}

export function buildPackageCreateHref(voucherIds: string[]): string {
  if (voucherIds.length === 0) return '/packages/new';
  const params = new URLSearchParams({ voucherIds: voucherIds.join(',') });
  return `/packages/new?${params.toString()}`;
}
