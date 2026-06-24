import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

const DELIVERY_DATA_SCOPE = ['identity', 'plots', 'evidence'] as const;

export type DeliveryConsentEnsureInput = {
  farmerId: string;
  granteeTenantId: string;
  actorUserId?: string | null;
  granteeOrgName?: string | null;
};

async function emitConsentAudit(
  pool: Pool,
  eventType: 'consent_grant_approved',
  payload: Record<string, unknown>,
): Promise<void> {
  await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
    eventType,
    JSON.stringify(payload),
  ]);
}

async function lookupLatestGrant(
  pool: Pool,
  farmerId: string,
  granteeTenantId: string,
): Promise<{
  id: string;
  status: string;
  purpose_code: string;
} | null> {
  try {
    const res = await pool.query<{ id: string; status: string; purpose_code: string }>(
      `
        SELECT id, status, purpose_code
        FROM consent_grants
        WHERE farmer_id = $1
          AND grantee_tenant_id = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [farmerId, granteeTenantId],
    );
    return res.rows[0] ?? null;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return null;
    }
    throw error;
  }
}

/**
 * Farmer-directed delivery implies consent for shipment preparation.
 * Creates or activates a grant when missing; rejects revoked/denied relationships.
 */
export async function ensureActiveConsentForDirectedDelivery(
  pool: Pool,
  input: DeliveryConsentEnsureInput,
): Promise<void> {
  const existing = await lookupLatestGrant(pool, input.farmerId, input.granteeTenantId);

  if (existing?.status === 'active') {
    return;
  }

  if (existing?.status === 'revoked') {
    throw new BadRequestException(
      'You revoked data sharing with this buyer. Re-enable sharing in Data sharing before delivering.',
    );
  }

  if (existing?.status === 'denied') {
    throw new BadRequestException(
      'You previously declined data sharing with this buyer. Approve sharing in Data sharing before delivering.',
    );
  }

  const auditBase = {
    farmer_id: input.farmerId,
    grantee_tenant_id: input.granteeTenantId,
    consent_source: 'delivery_directed',
    approved_by_user_id: input.actorUserId ?? null,
  };

  if (existing?.status === 'pending') {
    const res = await pool.query<{ id: string }>(
      `
        UPDATE consent_grants
        SET
          status = 'active',
          purpose_code = 'SHIPMENT_PREPARATION',
          consent_mechanism = 'DIGITAL',
          granted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND farmer_id = $2
          AND status = 'pending'
        RETURNING id
      `,
      [existing.id, input.farmerId],
    );
    if (res.rows[0]) {
      try {
        await emitConsentAudit(pool, 'consent_grant_approved', {
          ...auditBase,
          consent_grant_id: res.rows[0].id,
          activated_from: 'pending',
        });
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }
    }
    return;
  }

  const insert = await pool.query<{ id: string }>(
    `
      INSERT INTO consent_grants (
        farmer_id,
        grantee_tenant_id,
        grantee_org_name,
        requester_user_id,
        purpose_code,
        data_scope,
        status,
        consent_mechanism,
        granted_at
      )
      VALUES ($1, $2, $3, NULL, 'SHIPMENT_PREPARATION', $4::text[], 'active', 'DIGITAL', NOW())
      RETURNING id
    `,
    [
      input.farmerId,
      input.granteeTenantId,
      input.granteeOrgName?.trim() || null,
      [...DELIVERY_DATA_SCOPE],
    ],
  );

  try {
    await emitConsentAudit(pool, 'consent_grant_approved', {
      ...auditBase,
      consent_grant_id: insert.rows[0]?.id,
      activated_from: 'created',
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== '42P01') {
      throw error;
    }
  }
}

export async function farmerHasActiveDeliveryConsent(
  pool: Pool,
  farmerId: string,
  tenantId: string,
): Promise<boolean> {
  try {
    const res = await pool.query(
      `
        SELECT 1
        FROM consent_grants
        WHERE farmer_id = $1
          AND grantee_tenant_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [farmerId, tenantId],
    );
    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return false;
    }
    throw error;
  }
}
