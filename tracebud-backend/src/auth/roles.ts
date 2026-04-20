export type AppRole = 'farmer' | 'agent' | 'exporter' | 'admin' | 'compliance_manager';

function parseClaimRole(user: any): AppRole | null {
  const rawClaimRole =
    (user?.app_metadata?.role as string | undefined) ??
    (user?.user_metadata?.role as string | undefined) ??
    '';
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

  const email = (user?.email as string | undefined)?.toLowerCase();
  if (!email) {
    return 'farmer';
  }

  if (email.startsWith('agent+')) {
    return 'agent';
  }

  if (email.startsWith('exporter+') || email.endsWith('@tracebud.com')) {
    return 'exporter';
  }

  return 'farmer';
}

