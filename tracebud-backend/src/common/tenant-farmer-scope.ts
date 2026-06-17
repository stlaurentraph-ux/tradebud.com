import { Pool } from 'pg';

export async function resolveFarmerIdsForTenant(pool: Pool, tenantId: string): Promise<string[]> {
  try {
    const res = await pool.query<{ farmer_id: string }>(
      `
        SELECT DISTINCT farmer_id
        FROM (
          SELECT fp.id AS farmer_id
          FROM farmer_profile fp
          WHERE fp.user_id IN (
            SELECT NULLIF(user_id, '')::uuid
            FROM tenant_signup_contacts
            WHERE tenant_id = $1
              AND user_id IS NOT NULL
              AND user_id <> ''
          )
          UNION
          SELECT cc.farmer_profile_id AS farmer_id
          FROM crm_contacts cc
          WHERE cc.tenant_id = $1
            AND cc.farmer_profile_id IS NOT NULL
        ) scoped
        WHERE farmer_id IS NOT NULL
      `,
      [tenantId],
    );
    return res.rows.map((row) => row.farmer_id);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      try {
        const fallback = await pool.query<{ farmer_id: string }>(
          `
            SELECT fp.id AS farmer_id
            FROM farmer_profile fp
            WHERE fp.user_id IN (
              SELECT NULLIF(user_id, '')::uuid
              FROM tenant_signup_contacts
              WHERE tenant_id = $1
                AND user_id IS NOT NULL
                AND user_id <> ''
            )
          `,
          [tenantId],
        );
        return fallback.rows.map((row) => row.farmer_id);
      } catch (fallbackError) {
        const fallbackCode = (fallbackError as { code?: string } | null)?.code;
        if (fallbackCode === '42P01') {
          return [];
        }
        throw fallbackError;
      }
    }
    throw error;
  }
}

export async function isFarmerInTenant(pool: Pool, farmerId: string, tenantId: string): Promise<boolean> {
  const farmerIds = await resolveFarmerIdsForTenant(pool, tenantId);
  return farmerIds.includes(farmerId);
}
