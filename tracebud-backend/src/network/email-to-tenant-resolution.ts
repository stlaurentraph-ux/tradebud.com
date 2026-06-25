import { Pool } from 'pg';

/** Canonical email → tenant lookup sources (shared by delivery routing and campaign inbox fan-out). */
export const EMAIL_TENANT_RESOLUTION_SOURCES = [
  'tenant_signup_contacts',
  'admin_users',
] as const;

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = (email ?? '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Resolve workspace tenant ids for contact emails.
 * Order: tenant_signup_contacts, then admin_users (same as inbox campaign fan-out).
 */
export async function resolveTenantIdsByEmails(
  pool: Pool,
  emails: readonly string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const normalized = Array.from(
    new Set(
      emails
        .map((email) => normalizeEmail(email))
        .filter((email): email is string => email != null),
    ),
  );

  if (normalized.length === 0) {
    return resolved;
  }

  try {
    const signupRes = await pool.query<{ email: string; tenant_id: string }>(
      `
        SELECT LOWER(email) AS email, tenant_id
        FROM tenant_signup_contacts
        WHERE LOWER(email) = ANY($1::text[])
      `,
      [normalized],
    );
    for (const row of signupRes.rows) {
      resolved.set(row.email, row.tenant_id);
    }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }

  const unresolved = normalized.filter((email) => !resolved.has(email));
  if (unresolved.length === 0) {
    return resolved;
  }

  try {
    const adminRes = await pool.query<{ email: string; tenant_id: string }>(
      `
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email) AS email,
          tenant_id
        FROM admin_users
        WHERE LOWER(email) = ANY($1::text[])
        ORDER BY LOWER(email), invited_at DESC
      `,
      [unresolved],
    );
    for (const row of adminRes.rows) {
      if (!resolved.has(row.email)) {
        resolved.set(row.email, row.tenant_id);
      }
    }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }

  return resolved;
}

export async function resolveTenantIdForContactEmail(
  pool: Pool,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }
  const map = await resolveTenantIdsByEmails(pool, [normalized]);
  return map.get(normalized) ?? null;
}
