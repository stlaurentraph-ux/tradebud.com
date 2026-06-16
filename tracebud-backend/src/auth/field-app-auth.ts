import { Pool } from 'pg';

import { deriveRoleFromSupabaseUser } from './roles';

export type FieldActorRole = 'farmer' | 'agent';

/**
 * Field-app API actor: JWT farmer/agent, or any user with a linked farmer_profile row
 * (dashboard accounts that bootstrapped the field app).
 */
export async function resolveFieldActorRole(
  pool: Pool,
  user: { id?: string } | null | undefined,
): Promise<FieldActorRole | null> {
  const jwtRole = deriveRoleFromSupabaseUser(user);
  if (jwtRole === 'farmer' || jwtRole === 'agent') {
    return jwtRole;
  }

  const userId = user?.id;
  if (!userId) {
    return null;
  }

  const linked = await pool.query(
    `SELECT 1 FROM farmer_profile WHERE user_id = $1::uuid LIMIT 1`,
    [userId],
  );
  if (linked.rows.length > 0) {
    return 'farmer';
  }

  return null;
}
