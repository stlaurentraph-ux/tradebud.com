import type { TenantRole } from '@/types';

/** Dashboard roles that may open field-operations tools on plot detail (mobile agents use the field app). */
export const PLOT_FIELD_OPERATIONS_ROLES: TenantRole[] = ['exporter', 'cooperative'];

export function canViewPlotFieldOperations(role: TenantRole | null | undefined): boolean {
  return role != null && PLOT_FIELD_OPERATIONS_ROLES.includes(role);
}
