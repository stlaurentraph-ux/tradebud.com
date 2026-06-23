import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { resolveTenantIdForContactEmail } from '../network/email-to-tenant-resolution';

export interface VoucherDeliveryRecipientInput {
  farmerId: string;
  deliverToTenantId?: string | null;
  deliverToEmail?: string | null;
}

export interface ResolvedVoucherDeliveryRecipient {
  intendedRecipientTenantId: string | null;
  intendedRecipientEmail: string | null;
}

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = (email ?? '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export async function resolveTenantIdForBuyerEmail(pool: Pool, email: string): Promise<string | null> {
  return resolveTenantIdForContactEmail(pool, email);
}

export async function farmerCanDeliverToTenant(
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

export async function resolveVoucherDeliveryRecipient(
  pool: Pool,
  input: VoucherDeliveryRecipientInput,
): Promise<ResolvedVoucherDeliveryRecipient> {
  const deliverToTenantId = (input.deliverToTenantId ?? '').trim() || null;
  const deliverToEmail = normalizeEmail(input.deliverToEmail);

  if (!deliverToTenantId && !deliverToEmail) {
    return { intendedRecipientTenantId: null, intendedRecipientEmail: null };
  }

  let tenantId = deliverToTenantId;
  if (!tenantId && deliverToEmail) {
    tenantId = await resolveTenantIdForBuyerEmail(pool, deliverToEmail);
    if (!tenantId) {
      throw new BadRequestException(
        'No buyer organisation found for that email. Pick a buyer from your list or share the QR code directly.',
      );
    }
  }

  if (!tenantId) {
    throw new BadRequestException('Delivery recipient is required.');
  }

  const allowed = await farmerCanDeliverToTenant(pool, input.farmerId, tenantId);
  if (!allowed) {
    throw new BadRequestException(
      'You can only deliver to buyers who have an active data-sharing relationship with you.',
    );
  }

  return {
    intendedRecipientTenantId: tenantId,
    intendedRecipientEmail: deliverToEmail,
  };
}

export function tenantCanBrowseVoucherSql(alias = 'v'): string {
  return `(
    ${alias}.intended_recipient_tenant_id = $2
    OR EXISTS (
      SELECT 1
      FROM voucher_buyer_claims vbc
      WHERE vbc.voucher_id = ${alias}.id
        AND vbc.tenant_id = $2
    )
  )`;
}
