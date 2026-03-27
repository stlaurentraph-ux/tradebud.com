export type AppRole = 'farmer' | 'agent' | 'exporter';

export function deriveRoleFromSupabaseUser(user: any): AppRole {
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

