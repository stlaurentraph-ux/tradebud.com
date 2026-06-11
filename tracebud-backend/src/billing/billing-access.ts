import { ForbiddenException } from '@nestjs/common';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';

const BILLING_READ_ROLES = new Set([
  'admin',
  'compliance_manager',
  'exporter',
  'cooperative',
  'importer',
]);

export function resolveDashboardRole(user: Record<string, unknown> | undefined): string {
  const claim = (user?.app_metadata as { role?: string } | undefined)?.role?.trim().toLowerCase();
  if (claim) {
    return claim;
  }
  return deriveRoleFromSupabaseUser(user);
}

export function requireTenantId(req: { user?: Record<string, unknown> }): string {
  const tenantId = deriveTenantIdFromSupabaseUser(req.user);
  if (!tenantId) {
    throw new ForbiddenException('Missing tenant claim');
  }
  return tenantId;
}

export function assertBillingReadRole(role: string): void {
  if (!BILLING_READ_ROLES.has(role)) {
    throw new ForbiddenException('Insufficient permissions to view billing.');
  }
}
