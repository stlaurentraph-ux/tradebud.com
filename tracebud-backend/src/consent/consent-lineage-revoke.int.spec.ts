import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { ConsentService } from './consent.service';
import { HarvestController } from '../harvest/harvest.controller';
import { HarvestService } from '../harvest/harvest.service';
import { PlotsController } from '../plots/plots.controller';
import { PlotsService } from '../plots/plots.service';
import { createBillingServiceMock } from '../testing/billing-service.mock';
import { createLaunchServiceMock } from '../testing/launch-service.mock';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_consent_lineage_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const separator = connectionString.includes('?') ? '&' : '?';
  const options = encodeURIComponent(`-c search_path=${targetSchema},public`);
  return `${connectionString}${separator}options=${options}`;
}

const coopReq = (userId: string) => ({
  user: {
    id: userId,
    email: 'coop@example.com',
    app_metadata: { tenant_id: 'tenant_coop', role: 'cooperative' },
  },
});

describeIfDb('Consent sold-lineage revocation integration', () => {
  jest.setTimeout(60_000);

  let pool: Pool;
  let consentService: ConsentService;
  let plotsController: PlotsController;
  let harvestController: HarvestController;

  const farmerUserId = '11111111-1111-4111-8111-111111111111';
  const coopUserId = '22222222-2222-4222-8222-222222222222';
  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plotSoldId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const plotUnsoldId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const harvestSoldId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const harvestUnsoldId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const voucherSoldId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const voucherUnsoldId = '99999999-9999-4999-8999-999999999999';
  const packageId = '88888888-8888-4888-8888-888888888888';
  const grantId = '77777777-7777-4777-8777-777777777777';
  const tenantId = 'tenant_coop';

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
        user_id TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (tenant_id, email)
      );
      CREATE TABLE plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES farmer_profile(id),
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'polygon',
        area_ha NUMERIC NULL,
        declared_area_ha NUMERIC NULL,
        precision_m_at_capture NUMERIC NULL,
        sinaph_overlap BOOLEAN NULL,
        indigenous_overlap BOOLEAN NULL,
        production_system TEXT NULL,
        deforestation_screening JSONB NULL,
        status TEXT NOT NULL DEFAULT 'deforestation_clear',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE harvest_transaction (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        plot_id UUID NOT NULL,
        kg NUMERIC NOT NULL DEFAULT 100,
        harvest_date DATE NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE voucher (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        transaction_id UUID NOT NULL,
        qr_code_ref TEXT NULL,
        status TEXT NOT NULL DEFAULT 'issued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE dds_package (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES farmer_profile(id),
        label TEXT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        traces_reference TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE dds_package_voucher (
        dds_package_id UUID NOT NULL,
        voucher_id UUID NOT NULL,
        PRIMARY KEY (dds_package_id, voucher_id)
      );
      CREATE TABLE consent_grants (
        id UUID PRIMARY KEY,
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
        revocation_reason TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    const push = { registerDevice: jest.fn(), notifyFarmerConsentRequest: jest.fn() };
    consentService = new ConsentService(pool, push as any);
    const harvestService = new HarvestService(pool, createBillingServiceMock());
    const plotsService = new PlotsService(pool, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    harvestController = new HarvestController(harvestService, createLaunchServiceMock(), consentService);
    plotsController = new PlotsController(plotsService, consentService);
  }, 30_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`DELETE FROM consent_grants`);
    await pool.query(`DELETE FROM dds_package_voucher`);
    await pool.query(`DELETE FROM dds_package`);
    await pool.query(`DELETE FROM voucher`);
    await pool.query(`DELETE FROM harvest_transaction`);
    await pool.query(`DELETE FROM plot`);
    await pool.query(`DELETE FROM tenant_signup_contacts`);
    await pool.query(`DELETE FROM farmer_profile`);
    await pool.query(`DELETE FROM user_account`);

    await pool.query(
      `INSERT INTO user_account (id, role, name) VALUES ($1, 'farmer', 'Farmer'), ($2, 'cooperative', 'Coop')`,
      [farmerUserId, coopUserId],
    );
    await pool.query(`INSERT INTO farmer_profile (id, user_id) VALUES ($1, $2)`, [farmerId, farmerUserId]);
    await pool.query(
      `INSERT INTO tenant_signup_contacts (tenant_id, user_id, email) VALUES ($1, $2, 'farmer@example.com')`,
      [tenantId, farmerUserId],
    );
    await pool.query(
      `INSERT INTO plot (id, farmer_id, name) VALUES ($1, $3, 'Sold plot'), ($2, $3, 'Unsold plot')`,
      [plotSoldId, plotUnsoldId, farmerId],
    );
    await pool.query(
      `INSERT INTO harvest_transaction (id, farmer_id, plot_id, kg) VALUES ($1, $3, $4, 80), ($2, $3, $5, 40)`,
      [harvestSoldId, harvestUnsoldId, farmerId, plotSoldId, plotUnsoldId],
    );
    await pool.query(
      `INSERT INTO voucher (id, farmer_id, transaction_id, qr_code_ref) VALUES ($1, $3, $4, 'V-SOLD'), ($2, $3, $5, 'V-NEW')`,
      [voucherSoldId, voucherUnsoldId, farmerId, harvestSoldId, harvestUnsoldId],
    );
    await pool.query(
      `INSERT INTO dds_package (id, farmer_id, label, status, created_at) VALUES ($1, $2, 'Batch A', 'draft', NOW() - INTERVAL '1 hour')`,
      [packageId, farmerId],
    );
    await pool.query(
      `INSERT INTO dds_package_voucher (dds_package_id, voucher_id) VALUES ($1, $2)`,
      [packageId, voucherSoldId],
    );
    await pool.query(
      `
        INSERT INTO consent_grants (
          id, farmer_id, grantee_tenant_id, grantee_org_name, status, granted_at, updated_at
        ) VALUES ($1, $2, $3, 'Coop Demo', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
      `,
      [grantId, farmerId, tenantId],
    );
  });

  it('blocks new plot access while grant is pending', async () => {
    await pool.query(
      `UPDATE consent_grants SET status = 'pending', granted_at = NULL WHERE id = $1`,
      [grantId],
    );
    await expect(consentService.canTenantAccessFarmerNewData(farmerId, tenantId)).resolves.toBe(false);
    await expect(consentService.canTenantAccessPlot(plotUnsoldId, tenantId)).resolves.toBe(false);
    await expect(consentService.canTenantAccessPlot(plotSoldId, tenantId)).resolves.toBe(false);
  });

  it('allows full farmer data while grant is active', async () => {
    await expect(consentService.canTenantAccessFarmerNewData(farmerId, tenantId)).resolves.toBe(true);
    await expect(consentService.canTenantAccessPlot(plotUnsoldId, tenantId)).resolves.toBe(true);
    await expect(consentService.canTenantAccessVoucher(voucherUnsoldId, tenantId)).resolves.toBe(true);
  });

  it('after revoke, blocks new plots/vouchers but keeps sold-lineage access', async () => {
    await consentService.revokeGrant(grantId, farmerUserId, 'Producer ended relationship');

    await expect(consentService.canTenantAccessFarmerNewData(farmerId, tenantId)).resolves.toBe(false);
    await expect(consentService.canTenantAccessPlot(plotSoldId, tenantId)).resolves.toBe(true);
    await expect(consentService.canTenantAccessPlot(plotUnsoldId, tenantId)).resolves.toBe(false);
    await expect(consentService.canTenantAccessVoucher(voucherSoldId, tenantId)).resolves.toBe(true);
    await expect(consentService.canTenantAccessVoucher(voucherUnsoldId, tenantId)).resolves.toBe(false);
    await expect(consentService.canTenantAccessFarmer(farmerId, tenantId)).resolves.toBe(true);
  });

  it('plots and harvest APIs return sold lineage only after revoke', async () => {
    await consentService.revokeGrant(grantId, farmerUserId, 'Producer ended relationship');

    const plots = await plotsController.listByFarmer(farmerId, 'farmer', coopReq(coopUserId));
    expect(plots.map((p: { id: string }) => p.id)).toEqual([plotSoldId]);

    const voucherResult = await harvestController.listVouchers(farmerId, 'farmer', coopReq(coopUserId));
    const vouchers = Array.isArray(voucherResult) ? voucherResult : voucherResult.vouchers;
    expect(vouchers.map((v: { id: string }) => v.id)).toEqual([voucherSoldId]);
  });

  it('returns CONSENT_REQUIRED when revoke leaves no readable farmer plots', async () => {
    await pool.query(`DELETE FROM dds_package_voucher`);
    await pool.query(`DELETE FROM dds_package`);
    await consentService.revokeGrant(grantId, farmerUserId, 'Producer ended relationship');

    await expect(
      plotsController.listByFarmer(farmerId, 'farmer', coopReq(coopUserId)),
    ).rejects.toThrow(ForbiddenException);
  });
});
