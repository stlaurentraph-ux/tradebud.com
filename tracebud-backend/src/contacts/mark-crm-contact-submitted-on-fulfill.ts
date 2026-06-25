import { Pool } from 'pg';

export type MarkCrmContactSubmittedSource =
  | 'inbox_fulfillment'
  | 'consent_grant_approved';

export type MarkCrmContactSubmittedInput = {
  senderTenantId: string;
  recipientEmail?: string | null;
  farmerProfileId?: string | null;
  source: MarkCrmContactSubmittedSource;
  campaignId?: string | null;
  consentGrantId?: string | null;
};

export type MarkCrmContactSubmittedResult = {
  updated: boolean;
  contactId: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function emitContactStatusAudit(
  pool: Pool,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      'contact_status_changed',
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
 * Promote sender CRM contacts from engaged → submitted when a supplier fulfills evidence
 * (dashboard inbox respond or field consent grant approval).
 */
export async function markCrmContactSubmittedOnFulfill(
  pool: Pool,
  input: MarkCrmContactSubmittedInput,
): Promise<MarkCrmContactSubmittedResult> {
  const senderTenantId = input.senderTenantId.trim();
  const recipientEmail = input.recipientEmail ? normalizeEmail(input.recipientEmail) : null;
  const farmerProfileId = input.farmerProfileId?.trim() || null;

  if (!senderTenantId || (!recipientEmail && !farmerProfileId)) {
    return { updated: false, contactId: null };
  }

  try {
    let contactId: string | null = null;

    if (farmerProfileId) {
      const byFarmer = await pool.query<{ id: string }>(
        `
          UPDATE crm_contacts
          SET
            status = 'submitted',
            last_activity_at = NOW(),
            updated_at = NOW()
          WHERE tenant_id = $1
            AND farmer_profile_id = $2::uuid
            AND status = 'engaged'
          RETURNING id
        `,
        [senderTenantId, farmerProfileId],
      );
      contactId = byFarmer.rows[0]?.id ?? null;
    }

    if (!contactId && recipientEmail) {
      const byEmail = await pool.query<{ id: string }>(
        `
          UPDATE crm_contacts
          SET
            status = 'submitted',
            last_activity_at = NOW(),
            updated_at = NOW()
          WHERE tenant_id = $1
            AND lower(email) = $2
            AND status = 'engaged'
          RETURNING id
        `,
        [senderTenantId, recipientEmail],
      );
      contactId = byEmail.rows[0]?.id ?? null;
    }

    if (!contactId) {
      return { updated: false, contactId: null };
    }

    await emitContactStatusAudit(pool, {
      tenantId: senderTenantId,
      contactId,
      from: 'engaged',
      to: 'submitted',
      source: input.source,
      ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      ...(input.consentGrantId ? { consentGrantId: input.consentGrantId } : {}),
      ...(recipientEmail ? { recipientEmail } : {}),
      ...(farmerProfileId ? { farmerProfileId } : {}),
    });

    return { updated: true, contactId };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === '42P01' || code === '42703') {
      return { updated: false, contactId: null };
    }
    throw error;
  }
}
