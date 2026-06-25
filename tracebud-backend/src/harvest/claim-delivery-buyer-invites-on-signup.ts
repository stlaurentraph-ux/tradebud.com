import { Pool } from 'pg';
import { ensureActiveConsentForDirectedDelivery } from '../consent/delivery-consent-grant';

export type ClaimDeliveryBuyerInvitesOnSignupResult = {
  claimedCount: number;
  voucherIds: string[];
};

type PendingInviteRow = {
  invite_id: string;
  voucher_id: string;
  farmer_id: string;
  invite_status: string;
  intended_recipient_tenant_id: string | null;
  intended_recipient_email: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function emitClaimAudit(
  pool: Pool,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      eventType,
      JSON.stringify(payload),
    ]);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return;
    }
    throw error;
  }
}

async function listPendingInvites(
  pool: Pool,
  recipientEmail: string,
): Promise<PendingInviteRow[]> {
  try {
    const res = await pool.query<PendingInviteRow>(
      `
        SELECT
          vbi.id AS invite_id,
          vbi.voucher_id,
          vbi.farmer_id,
          vbi.status AS invite_status,
          v.intended_recipient_tenant_id,
          v.intended_recipient_email
        FROM voucher_buyer_invites vbi
        JOIN voucher v ON v.id = vbi.voucher_id
        WHERE lower(vbi.recipient_email) = $1
          AND vbi.status IN ('pending', 'sent')
          AND lower(COALESCE(v.intended_recipient_email, vbi.recipient_email)) = $1
        ORDER BY vbi.created_at ASC
      `,
      [recipientEmail],
    );
    return res.rows;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01') {
      return [];
    }
    throw error;
  }
}

/**
 * When a buyer signs up with an email that received a field delivery invite,
 * link pending vouchers to their workspace and activate shipment consent.
 */
export async function claimPendingDeliveryBuyerInvitesOnSignup(
  pool: Pool,
  input: {
    recipientEmail: string;
    tenantId: string;
    actorUserId?: string | null;
    granteeOrgName?: string | null;
  },
): Promise<ClaimDeliveryBuyerInvitesOnSignupResult> {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const tenantId = input.tenantId.trim();
  if (!recipientEmail || !tenantId) {
    return { claimedCount: 0, voucherIds: [] };
  }

  const pending = await listPendingInvites(pool, recipientEmail);
  const voucherIds: string[] = [];

  for (const invite of pending) {
    const directedTenant = invite.intended_recipient_tenant_id?.trim() || null;
    if (directedTenant && directedTenant !== tenantId) {
      await emitClaimAudit(pool, 'delivery_buyer_invite_claim_skipped', {
        invite_id: invite.invite_id,
        voucher_id: invite.voucher_id,
        recipient_email: recipientEmail,
        tenant_id: tenantId,
        reason: 'directed_to_other_tenant',
        directed_tenant_id: directedTenant,
      });
      continue;
    }

    if (directedTenant === tenantId) {
      await pool.query(
        `
          UPDATE voucher_buyer_invites
          SET status = 'claimed', claimed_tenant_id = $1
          WHERE id = $2
            AND status IN ('pending', 'sent')
        `,
        [tenantId, invite.invite_id],
      );
      if (!voucherIds.includes(invite.voucher_id)) {
        voucherIds.push(invite.voucher_id);
      }
      continue;
    }

    await ensureActiveConsentForDirectedDelivery(pool, {
      farmerId: invite.farmer_id,
      granteeTenantId: tenantId,
      actorUserId: input.actorUserId ?? null,
      granteeOrgName: input.granteeOrgName ?? null,
    });

    const voucherUpdate = await pool.query<{ id: string }>(
      `
        UPDATE voucher
        SET intended_recipient_tenant_id = $1
        WHERE id = $2
          AND intended_recipient_tenant_id IS NULL
          AND lower(COALESCE(intended_recipient_email, '')) = $3
        RETURNING id
      `,
      [tenantId, invite.voucher_id, recipientEmail],
    );

    if ((voucherUpdate.rowCount ?? 0) === 0) {
      continue;
    }

    await pool.query(
      `
        UPDATE voucher_buyer_invites
        SET status = 'claimed', claimed_tenant_id = $1
        WHERE id = $2
          AND status IN ('pending', 'sent')
      `,
      [tenantId, invite.invite_id],
    );

    voucherIds.push(invite.voucher_id);
    await emitClaimAudit(pool, 'delivery_buyer_invite_claimed', {
      invite_id: invite.invite_id,
      voucher_id: invite.voucher_id,
      farmer_id: invite.farmer_id,
      recipient_email: recipientEmail,
      tenant_id: tenantId,
      actor_user_id: input.actorUserId ?? null,
    });
  }

  return { claimedCount: voucherIds.length, voucherIds };
}
