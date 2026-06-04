export type AppRole = 'farmer' | 'agent' | 'exporter' | 'admin' | 'compliance_manager';

function parseClaimRole(user: any): AppRole | null {
  const rawClaimRole = (user?.app_metadata?.role as string | undefined) ?? '';
  const claimRole = rawClaimRole.trim().toLowerCase();
  if (!claimRole) {
    return null;
  }

  if (claimRole === 'admin') {
    return 'admin';
  }
  if (claimRole === 'compliance_manager' || claimRole === 'compliance-manager') {
    return 'compliance_manager';
  }
  if (claimRole === 'exporter') {
    return 'exporter';
  }
  if (claimRole === 'agent') {
    return 'agent';
  }
  if (claimRole === 'farmer') {
    return 'farmer';
  }
  return null;
}

export function deriveRoleFromSupabaseUser(user: any): AppRole {
  const claimRole = parseClaimRole(user);
  if (claimRole) {
    return claimRole;
  }
  return 'farmer';
}

export function deriveTenantIdFromSupabaseUser(user: any): string | null {
  const appTenant = user?.app_metadata?.tenant_id;
  if (typeof appTenant !== 'string') {
    return null;
  }
  const tenantId = appTenant.trim();
  return tenantId.length > 0 ? tenantId : null;
}

