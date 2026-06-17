import type { TenantRole } from '@/types';

const GEOMETRY_REVIEW_ROLES: TenantRole[] = [
  'exporter',
  'cooperative',
  'admin',
  'country_reviewer',
];

export function canRevisePlotGeometry(role: TenantRole | null | undefined): boolean {
  if (!role) return false;
  return GEOMETRY_REVIEW_ROLES.includes(role);
}
