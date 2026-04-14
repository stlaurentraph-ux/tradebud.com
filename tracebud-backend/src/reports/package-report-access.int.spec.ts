import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { HarvestController } from '../harvest/harvest.controller';
import { HarvestService } from '../harvest/harvest.service';
import { ReportsController } from './reports.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;

function makeResponseMock() {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  };
}

describeIfDb('API integration: package/report access policy', () => {
  let pool: Pool;
  let harvestController: HarvestController;
  let reportsController: ReportsController;

  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plotId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const harvestId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const voucherId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const packageId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: testDbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query('CREATE SCHEMA IF NOT EXISTS tb_api_access_test');
    await pool.query('SET search_path TO tb_api_access_test, public');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'polygon',
        area_ha NUMERIC NOT NULL DEFAULT 1,
        declared_area_ha NUMERIC NULL,
        sinaph_overlap BOOLEAN NOT NULL DEFAULT false,
        indigenous_overlap BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'compliant',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS harvest_transaction (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        plot_id UUID NOT NULL,
        kg NUMERIC NOT NULL,
        harvest_date DATE NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voucher (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        transaction_id UUID NOT NULL,
        qr_code_ref TEXT NULL,
        status TEXT NOT NULL DEFAULT 'issued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dds_package (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL,
        label TEXT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        traces_reference TEXT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dds_package_voucher (
        dds_package_id UUID NOT NULL,
        voucher_id UUID NOT NULL
      )
    `);

    harvestController = new HarvestController(new HarvestService(pool));
    reportsController = new ReportsController(pool);
  }, 20_000);

  afterAll(async () => {
    await pool.query('DROP SCHEMA IF EXISTS tb_api_access_test CASCADE');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM dds_package_voucher');
    await pool.query('DELETE FROM dds_package');
    await pool.query('DELETE FROM voucher');
    await pool.query('DELETE FROM harvest_transaction');
    await pool.query('DELETE FROM plot');

    await pool.query(
      `
      INSERT INTO plot (id, farmer_id, name, kind, area_ha, declared_area_ha, created_at)
      VALUES ($1, $2, 'Plot A', 'polygon', 1, 1, NOW())
      `,
      [plotId, farmerId],
    );
    await pool.query(
      `
      INSERT INTO harvest_transaction (id, farmer_id, plot_id, kg, harvest_date, created_at)
      VALUES ($1, $2, $3, 100, CURRENT_DATE, NOW())
      `,
      [harvestId, farmerId, plotId],
    );
    await pool.query(
      `
      INSERT INTO voucher (id, farmer_id, transaction_id, qr_code_ref, status, created_at)
      VALUES ($1, $2, $3, 'V-TEST001', 'issued', NOW())
      `,
      [voucherId, farmerId, harvestId],
    );
    await pool.query(
      `
      INSERT INTO dds_package (id, farmer_id, label, status, created_at, traces_reference)
      VALUES ($1, $2, 'Pkg A', 'submitted', NOW(), 'TRACES-ABC123')
      `,
      [packageId, farmerId],
    );
    await pool.query(
      `
      INSERT INTO dds_package_voucher (dds_package_id, voucher_id)
      VALUES ($1, $2)
      `,
      [packageId, voucherId],
    );
  });

  it('denies package and report export when tenant claim is missing', async () => {
    await expect(
      harvestController.listPackages(farmerId, { user: { email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackage(packageId, { user: { email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackageTracesJson(packageId, { user: { email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);

    const res = makeResponseMock();
    await expect(
      reportsController.plotsReport(
        farmerId,
        undefined,
        { user: { email: 'exporter+demo@tracebud.com' } },
        res as any,
      ),
    ).rejects.toThrow(ForbiddenException);

    const resHarvest = makeResponseMock();
    await expect(
      reportsController.harvestsReport(
        farmerId,
        undefined,
        undefined,
        undefined,
        { user: { email: 'exporter+demo@tracebud.com' } },
        resHarvest as any,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies package and report export for non-exporter role even with tenant claim', async () => {
    await expect(
      harvestController.listPackages(farmerId, {
        user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackage(packageId, {
        user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackageTracesJson(packageId, {
        user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    const res = makeResponseMock();
    await expect(
      reportsController.plotsReport(
        farmerId,
        undefined,
        { user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
        res as any,
      ),
    ).rejects.toThrow(ForbiddenException);

    const resHarvest = makeResponseMock();
    await expect(
      reportsController.harvestsReport(
        farmerId,
        undefined,
        undefined,
        undefined,
        { user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
        resHarvest as any,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows exporter role with tenant claim for package and report export', async () => {
    await expect(
      harvestController.listPackages(farmerId, {
        user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: packageId,
          farmer_id: farmerId,
        }),
      ]),
    );

    await expect(
      harvestController.getPackage(packageId, {
        user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toMatchObject({
      package: expect.objectContaining({
        id: packageId,
        farmer_id: farmerId,
      }),
    });

    await expect(
      harvestController.getPackageTracesJson(packageId, {
        user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toMatchObject({
      ddsPackageId: packageId,
      tracesReference: 'TRACES-ABC123',
    });

    const res = makeResponseMock();
    await reportsController.plotsReport(
      farmerId,
      undefined,
      { user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } } },
      res as any,
    );
    expect(res.json).toHaveBeenCalled();

    const resHarvest = makeResponseMock();
    await reportsController.harvestsReport(
      farmerId,
      undefined,
      undefined,
      undefined,
      { user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } } },
      resHarvest as any,
    );
    expect(resHarvest.json).toHaveBeenCalled();
  });
});
