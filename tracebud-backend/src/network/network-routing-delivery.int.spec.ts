import { Pool } from 'pg';
import { HarvestService } from '../harvest/harvest.service';
import { claimPendingDeliveryBuyerInvitesOnSignup } from '../harvest/claim-delivery-buyer-invites-on-signup';
import { resolveTenantIdForContactEmail } from './email-to-tenant-resolution';
import { createBillingServiceMock } from '../testing/billing-service.mock';
import { requireTestDatabaseUrl } from '../testing/require-test-database-url';

const testDbUrl = requireTestDatabaseUrl();

const schema = `tb_network_routing_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const separator = connectionString.includes('?') ? '&' : '?';
  const options = encodeURIComponent(`-c search_path=${targetSchema},public`);
  return `${connectionString}${separator}options=${options}`;
}

describe('Network routing — delivery to buyer tenant integration', () => {
  jest.setTimeout(60_000);

  let pool: Pool;
  let harvestService: HarvestService;

  const farmerUserId = '11111111-1111-4111-8111-111111111111';
  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plotId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const buyerTenantId = 'tenant_exporter';
  const buyerEmail = 'buyer@exporter.example';
  const grantId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA ${schema}`);

    await pool.query(`
      CREATE TABLE user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'farmer',
        name TEXT NULL
      );
      CREATE TABLE farmer_profile (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_account(id),
        country_code TEXT NOT NULL DEFAULT 'HN',
        self_declared BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active'
      );
      CREATE TABLE tenant_signup_contacts (
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL,
        PRIMARY KEY (tenant_id, email)
      );
      CREATE TABLE admin_users (
        email TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE consent_grants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL REFERENCES farmer_profile(id) ON DELETE CASCADE,
        grantee_tenant_id TEXT NOT NULL,
        grantee_org_name TEXT NULL,
        requester_user_id UUID NULL,
        purpose_code TEXT NOT NULL DEFAULT 'COMPLIANCE_COLLECTION',
        data_scope TEXT[] NOT NULL DEFAULT ARRAY['identity','plots','evidence']::TEXT[],
        status TEXT NOT NULL DEFAULT 'pending',
        consent_mechanism TEXT NULL,
        granted_at TIMESTAMPTZ NULL,
        revoked_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES farmer_profile(id),
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'polygon',
        area_ha NUMERIC NULL DEFAULT 2,
        sinaph_overlap BOOLEAN NULL DEFAULT false,
        indigenous_overlap BOOLEAN NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'deforestation_clear',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE harvest_transaction (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL,
        plot_id UUID NOT NULL,
        kg NUMERIC NOT NULL DEFAULT 100,
        harvest_date DATE NULL,
        created_by UUID NULL,
        client_event_id TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE voucher (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL,
        transaction_id UUID NOT NULL,
        qr_code_ref TEXT NULL,
        delivery_trip_ref TEXT NULL,
        status TEXT NOT NULL DEFAULT 'issued',
        intended_recipient_email TEXT NULL,
        intended_recipient_tenant_id TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE voucher_buyer_claims (
        voucher_id UUID NOT NULL,
        tenant_id TEXT NOT NULL,
        claimed_by_user_id UUID NULL,
        claim_source TEXT NULL,
        PRIMARY KEY (voucher_id, tenant_id)
      );
      CREATE TABLE voucher_buyer_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        voucher_id UUID NOT NULL,
        farmer_id UUID NOT NULL,
        recipient_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMPTZ NULL,
        claimed_tenant_id TEXT NULL,
        reminder_nudge_sent_at TIMESTAMPTZ NULL,
        reminder_nudge_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (voucher_id, recipient_email)
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

    harvestService = new HarvestService(pool, createBillingServiceMock());
  }, 30_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`DELETE FROM voucher_buyer_invites`);
    await pool.query(`DELETE FROM voucher_buyer_claims`);
    await pool.query(`DELETE FROM voucher`);
    await pool.query(`DELETE FROM harvest_transaction`);
    await pool.query(`DELETE FROM consent_grants`);
    await pool.query(`DELETE FROM plot`);
    await pool.query(`DELETE FROM admin_users`);
    await pool.query(`DELETE FROM tenant_signup_contacts`);
    await pool.query(`DELETE FROM farmer_profile`);
    await pool.query(`DELETE FROM user_account`);

    await pool.query(`INSERT INTO user_account (id, role, name) VALUES ($1, 'farmer', 'Farmer')`, [
      farmerUserId,
    ]);
    await pool.query(`INSERT INTO farmer_profile (id, user_id) VALUES ($1, $2)`, [
      farmerId,
      farmerUserId,
    ]);
    await pool.query(
      `INSERT INTO plot (id, farmer_id, name, area_ha) VALUES ($1, $2, 'Plot 1', 2)`,
      [plotId, farmerId],
    );
    await pool.query(
      `INSERT INTO consent_grants (id, farmer_id, grantee_tenant_id, grantee_org_name, status)
       VALUES ($1, $2, $3, 'Exporter Org', 'active')`,
      [grantId, farmerId, buyerTenantId],
    );
  });

  it('resolves buyer email via admin_users (parity with campaign fan-out)', async () => {
    await pool.query(
      `INSERT INTO admin_users (email, tenant_id) VALUES ($1, $2)`,
      [buyerEmail, buyerTenantId],
    );

    await expect(resolveTenantIdForContactEmail(pool, buyerEmail)).resolves.toBe(buyerTenantId);
  });

  it('shows directed delivery on buyer tenant after consent + harvest submit', async () => {
    await pool.query(
      `INSERT INTO tenant_signup_contacts (tenant_id, user_id, email) VALUES ($1, '', $2)`,
      [buyerTenantId, buyerEmail],
    );

    const created = await harvestService.create(
      {
        farmerId,
        plotId,
        kg: 120,
        deliverToEmail: buyerEmail,
      },
      farmerUserId,
    );

    expect(created.voucher.intended_recipient_tenant_id).toBe(buyerTenantId);
    expect(created.voucher.intended_recipient_email).toBe(buyerEmail);

    const buyerVouchers = await harvestService.listVouchersForTenant(buyerTenantId);
    expect(buyerVouchers.some((row) => row.id === created.voucher.id)).toBe(true);
  });

  it('auto-grants SHIPMENT_PREPARATION consent when delivering by email without prior grant', async () => {
    await pool.query(`DELETE FROM consent_grants`);
    await pool.query(
      `INSERT INTO tenant_signup_contacts (tenant_id, user_id, email) VALUES ($1, '', $2)`,
      [buyerTenantId, buyerEmail],
    );

    const created = await harvestService.create(
      {
        farmerId,
        plotId,
        kg: 80,
        deliverToEmail: buyerEmail,
      },
      farmerUserId,
    );

    const grants = await pool.query<{
      status: string;
      purpose_code: string;
      grantee_tenant_id: string;
    }>(`SELECT status, purpose_code, grantee_tenant_id FROM consent_grants WHERE farmer_id = $1`, [
      farmerId,
    ]);

    expect(grants.rows).toHaveLength(1);
    expect(grants.rows[0]?.status).toBe('active');
    expect(grants.rows[0]?.purpose_code).toBe('SHIPMENT_PREPARATION');
    expect(grants.rows[0]?.grantee_tenant_id).toBe(buyerTenantId);
    expect(created.voucher.intended_recipient_tenant_id).toBe(buyerTenantId);

    const buyerVouchers = await harvestService.listVouchersForTenant(buyerTenantId);
    expect(buyerVouchers.some((row) => row.id === created.voucher.id)).toBe(true);
  });

  it('queues buyer invite when email is not on Tracebud dashboard yet', async () => {
    await pool.query(`DELETE FROM consent_grants`);
    const unknownEmail = 'future-buyer@coop.example';

    const created = await harvestService.create(
      {
        farmerId,
        plotId,
        kg: 65,
        deliverToEmail: unknownEmail,
      },
      farmerUserId,
    );

    expect(created.voucher.intended_recipient_tenant_id).toBeNull();
    expect(created.voucher.intended_recipient_email).toBe(unknownEmail);
    expect(created.buyerInvite).toEqual({
      email: unknownEmail,
      pending: true,
      inviteSent: false,
    });

    const invites = await pool.query<{ recipient_email: string; status: string }>(
      `SELECT recipient_email, status FROM voucher_buyer_invites WHERE voucher_id = $1`,
      [created.voucher.id],
    );
    expect(invites.rows[0]?.recipient_email).toBe(unknownEmail);
    expect(invites.rows[0]?.status).toBe('pending');
  });

  it('claims pending delivery invites when buyer signs up with invited email', async () => {
    await pool.query(`DELETE FROM consent_grants`);
    const unknownEmail = 'future-buyer@coop.example';
    const newBuyerTenantId = 'tenant_future_buyer';

    const created = await harvestService.create(
      {
        farmerId,
        plotId,
        kg: 70,
        deliverToEmail: unknownEmail,
      },
      farmerUserId,
    );

    await pool.query(
      `INSERT INTO tenant_signup_contacts (tenant_id, user_id, email) VALUES ($1, $2, $3)`,
      [newBuyerTenantId, '22222222-2222-4222-8222-222222222222', unknownEmail],
    );

    const claimResult = await claimPendingDeliveryBuyerInvitesOnSignup(pool, {
      recipientEmail: unknownEmail,
      tenantId: newBuyerTenantId,
      actorUserId: '22222222-2222-4222-8222-222222222222',
      granteeOrgName: 'Future Buyer Coop',
    });

    expect(claimResult.claimedCount).toBe(1);
    expect(claimResult.voucherIds).toContain(created.voucher.id);

    const voucher = await pool.query<{ intended_recipient_tenant_id: string | null }>(
      `SELECT intended_recipient_tenant_id FROM voucher WHERE id = $1`,
      [created.voucher.id],
    );
    expect(voucher.rows[0]?.intended_recipient_tenant_id).toBe(newBuyerTenantId);

    const invite = await pool.query<{ status: string; claimed_tenant_id: string | null }>(
      `SELECT status, claimed_tenant_id FROM voucher_buyer_invites WHERE voucher_id = $1`,
      [created.voucher.id],
    );
    expect(invite.rows[0]?.status).toBe('claimed');
    expect(invite.rows[0]?.claimed_tenant_id).toBe(newBuyerTenantId);

    const grants = await pool.query<{ status: string; grantee_tenant_id: string }>(
      `SELECT status, grantee_tenant_id FROM consent_grants WHERE farmer_id = $1`,
      [farmerId],
    );
    expect(grants.rows.some((row) => row.grantee_tenant_id === newBuyerTenantId && row.status === 'active')).toBe(
      true,
    );

    const buyerVouchers = await harvestService.listVouchersForTenant(newBuyerTenantId);
    expect(buyerVouchers.some((row) => row.id === created.voucher.id)).toBe(true);
  });

  it('rejects delivery when consent was revoked', async () => {
    await pool.query(`UPDATE consent_grants SET status = 'revoked', revoked_at = NOW()`);
    await pool.query(
      `INSERT INTO tenant_signup_contacts (tenant_id, user_id, email) VALUES ($1, '', $2)`,
      [buyerTenantId, buyerEmail],
    );

    await expect(
      harvestService.create(
        {
          farmerId,
          plotId,
          kg: 50,
          deliverToEmail: buyerEmail,
        },
        farmerUserId,
      ),
    ).rejects.toThrow(/revoked data sharing/);
  });
});
