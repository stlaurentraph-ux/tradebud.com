import { Pool } from 'pg';

export type TenantConsentGate = {
  /** Latest grant status for this farmer ↔ tenant pair. */
  status: 'active' | 'revoked' | 'denied' | 'pending' | 'none';
  /** Set when status is revoked — lineage allocated before this time remains readable. */
  revokedAt: string | null;
};

export async function resolveTenantConsentGate(
  pool: Pool,
  farmerId: string,
  tenantId: string,
): Promise<TenantConsentGate> {
  try {
    const res = await pool.query<{ status: string; revoked_at: Date | null }>(
      `
        SELECT status, revoked_at
        FROM consent_grants
        WHERE farmer_id = $1
          AND grantee_tenant_id = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [farmerId, tenantId],
    );
    const row = res.rows[0];
    if (!row) {
      return { status: 'none', revokedAt: null };
    }
    const status = row.status as TenantConsentGate['status'];
    return {
      status,
      revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return { status: 'none', revokedAt: null };
    }
    throw error;
  }
}

/** Plot geometry/evidence tied to a voucher allocated to a DDS package (sold batch). */
export async function isPlotInSoldLineageForTenant(
  pool: Pool,
  plotId: string,
  farmerId: string,
  revokedAt: string | null,
): Promise<boolean> {
  try {
    const res = await pool.query<{ sold: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM harvest_transaction ht
          INNER JOIN voucher v ON v.transaction_id = ht.id AND v.farmer_id = $2
          INNER JOIN dds_package_voucher dpv ON dpv.voucher_id = v.id
          INNER JOIN dds_package dp ON dp.id = dpv.dds_package_id AND dp.farmer_id = $2
          WHERE ht.plot_id = $1
            AND ($3::timestamptz IS NULL OR dp.created_at < $3::timestamptz)
        ) AS sold
      `,
      [plotId, farmerId, revokedAt],
    );
    return Boolean(res.rows[0]?.sold);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return false;
    }
    throw error;
  }
}

/** Voucher allocated to a DDS package before revocation (sold into a batch). */
export async function isVoucherInSoldLineage(
  pool: Pool,
  voucherId: string,
  farmerId: string,
  revokedAt: string | null,
): Promise<boolean> {
  try {
    const res = await pool.query<{ sold: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM dds_package_voucher dpv
          INNER JOIN dds_package dp ON dp.id = dpv.dds_package_id AND dp.farmer_id = $2
          WHERE dpv.voucher_id = $1
            AND ($3::timestamptz IS NULL OR dp.created_at < $3::timestamptz)
        ) AS sold
      `,
      [voucherId, farmerId, revokedAt],
    );
    return Boolean(res.rows[0]?.sold);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return false;
    }
    throw error;
  }
}

/** Any sold batch exists for this producer (evidence file access after revoke). */
export async function hasSoldLineageForTenant(
  pool: Pool,
  farmerId: string,
  revokedAt: string | null,
): Promise<boolean> {
  try {
    const res = await pool.query<{ sold: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM dds_package dp
          WHERE dp.farmer_id = $1
            AND ($2::timestamptz IS NULL OR dp.created_at < $2::timestamptz)
        ) AS sold
      `,
      [farmerId, revokedAt],
    );
    return Boolean(res.rows[0]?.sold);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return false;
    }
    throw error;
  }
}
