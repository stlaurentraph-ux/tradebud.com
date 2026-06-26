import { Pool } from 'pg';
import { markCrmContactSubmittedOnFulfill } from '../contacts/mark-crm-contact-submitted-on-fulfill';
import type { InboxService } from '../inbox/inbox.service';
import { linkPendingNetworkInvitesOnSignup } from './link-pending-network-invites-on-signup';
import { requireTestDatabaseUrl } from '../testing/require-test-database-url';

const testDbUrl = requireTestDatabaseUrl();

const schema = `tb_supplier_onboarding_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const separator = connectionString.includes('?') ? '&' : '?';
  const options = encodeURIComponent(`-c search_path=${targetSchema},public`);
  return `${connectionString}${separator}options=${options}`;
}

describe('Supplier campaign onboarding integration', () => {
  jest.setTimeout(60_000);

  let pool: Pool;
  let inboxService: InboxService;

  const senderTenantId = 'tenant_exporter';
  const recipientTenantId = 'tenant_supplier';
  const supplierEmail = 'supplier@coop.example';
  const campaignId = 'camp_integration_001';
  const contactId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const actorUserId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    inboxService = {
      ensureInboxForCampaignRecipient: jest.fn().mockResolvedValue({ created: true }),
      backfillInboxForSignupContact: jest.fn().mockResolvedValue(undefined),
    } as unknown as InboxService;

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA ${schema}`);

    await pool.query(`
      CREATE TABLE crm_contacts (
        id UUID PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        email TEXT NULL,
        phone TEXT NULL,
        contact_type TEXT NOT NULL DEFAULT 'supplier',
        status TEXT NOT NULL DEFAULT 'invited',
        farmer_profile_id UUID NULL,
        last_activity_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE campaign_recipient_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id TEXT NOT NULL,
        sender_tenant_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        sent_at TIMESTAMPTZ NULL,
        claimed_tenant_id TEXT NULL,
        claimed_farmer_profile_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (campaign_id, recipient_email)
      );
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);
  }, 30_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await pool.query(`DELETE FROM audit_log`);
    await pool.query(`DELETE FROM campaign_recipient_invites`);
    await pool.query(`DELETE FROM crm_contacts`);

    await pool.query(
      `
        INSERT INTO crm_contacts (id, tenant_id, email, contact_type, status)
        VALUES ($1, $2, $3, 'supplier', 'invited')
      `,
      [contactId, senderTenantId, supplierEmail],
    );
    await pool.query(
      `
        INSERT INTO campaign_recipient_invites (
          campaign_id,
          sender_tenant_id,
          recipient_email,
          status,
          sent_at
        )
        VALUES ($1, $2, $3, 'sent', NOW())
      `,
      [campaignId, senderTenantId, supplierEmail],
    );
  });

  it('signup claim promotes CRM engaged then fulfill promotes submitted', async () => {
    const claimResult = await linkPendingNetworkInvitesOnSignup(pool, inboxService, {
      recipientEmail: supplierEmail,
      tenantId: recipientTenantId,
      actorUserId,
    });

    expect(claimResult.campaignRecipientClaimedCount).toBe(1);
    expect(claimResult.supplierContactsEngaged).toBe(1);
    expect(inboxService.ensureInboxForCampaignRecipient).toHaveBeenCalledWith({
      campaignId,
      recipientTenantId,
    });

    const engaged = await pool.query<{ status: string }>(
      `SELECT status FROM crm_contacts WHERE id = $1`,
      [contactId],
    );
    expect(engaged.rows[0]?.status).toBe('engaged');

    const claimedInvite = await pool.query<{ claimed_tenant_id: string | null }>(
      `
        SELECT claimed_tenant_id
        FROM campaign_recipient_invites
        WHERE campaign_id = $1 AND lower(recipient_email) = $2
      `,
      [campaignId, supplierEmail],
    );
    expect(claimedInvite.rows[0]?.claimed_tenant_id).toBe(recipientTenantId);

    const fulfillResult = await markCrmContactSubmittedOnFulfill(pool, {
      senderTenantId,
      recipientEmail: supplierEmail,
      source: 'inbox_fulfillment',
      campaignId,
    });
    expect(fulfillResult.updated).toBe(true);

    const submitted = await pool.query<{ status: string }>(
      `SELECT status FROM crm_contacts WHERE id = $1`,
      [contactId],
    );
    expect(submitted.rows[0]?.status).toBe('submitted');

    const audit = await pool.query<{ event_type: string }>(
      `SELECT event_type FROM audit_log WHERE event_type = 'contact_status_changed'`,
    );
    expect(audit.rowCount).toBeGreaterThan(0);
  });
});
