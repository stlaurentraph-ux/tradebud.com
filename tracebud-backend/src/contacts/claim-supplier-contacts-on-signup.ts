import { Pool } from 'pg';

export type ClaimSupplierContactsOnSignupResult = {
  updatedCount: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function emitAudit(
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

/**
 * Promote sender CRM contacts to engaged when an invited supplier signs up with the same email.
 */
export async function claimSupplierContactsOnSignup(
  pool: Pool,
  input: {
    recipientEmail: string;
    recipientTenantId: string;
    actorUserId?: string | null;
  },
): Promise<ClaimSupplierContactsOnSignupResult> {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const recipientTenantId = input.recipientTenantId.trim();
  if (!recipientEmail || !recipientTenantId) {
    return { updatedCount: 0 };
  }

  try {
    const res = await pool.query<{ id: string }>(
      `
        UPDATE crm_contacts
        SET
          status = 'engaged',
          last_activity_at = NOW(),
          updated_at = NOW()
        WHERE lower(email) = $1
          AND tenant_id <> $2
          AND status IN ('new', 'invited')
        RETURNING id
      `,
      [recipientEmail, recipientTenantId],
    );
    const updatedCount = res.rowCount ?? 0;
    if (updatedCount > 0) {
      await emitAudit(pool, 'supplier_contacts_engaged_on_signup', {
        recipient_email: recipientEmail,
        recipient_tenant_id: recipientTenantId,
        updated_count: updatedCount,
        contact_ids: res.rows.map((row) => row.id),
        actor_user_id: input.actorUserId ?? null,
      });
    }
    return { updatedCount };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return { updatedCount: 0 };
    }
    throw error;
  }
}
