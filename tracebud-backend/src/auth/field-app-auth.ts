import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from './roles';

export type FieldActorRole = 'farmer' | 'agent';

function readMetadataString(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined,
  key: string,
): string | null {
  const app = user?.app_metadata?.[key];
  if (typeof app === 'string' && app.trim()) {
    return app.trim();
  }
  const userMeta = user?.user_metadata?.[key];
  if (typeof userMeta === 'string' && userMeta.trim()) {
    return userMeta.trim();
  }
  return null;
}

/** True for native field-app signups and dashboard accounts that linked the field app. */
export function isFieldAppSignupUser(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined,
): boolean {
  if (readMetadataString(user, 'signup_source') === 'field-app') {
    return true;
  }
  const linked = user?.user_metadata?.field_app_linked ?? user?.app_metadata?.field_app_linked;
  return linked === true || linked === 'true';
}

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

/** Dashboard operators need tenant_id; self-declared field-app farmers/agents may sync without it. */
export async function assertTenantClaimOrFieldActor(
  pool: Pool,
  user:
    | {
        id?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
      }
    | null
    | undefined,
): Promise<void> {
  if (deriveTenantIdFromSupabaseUser(user)) {
    return;
  }
  const actorRole = await resolveFieldActorRole(pool, user);
  if (actorRole === 'farmer' || actorRole === 'agent') {
    return;
  }
  if (isFieldAppSignupUser(user)) {
    return;
  }
  throw new ForbiddenException('Missing tenant claim in app_metadata');
}
