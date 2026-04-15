import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { PlotsController } from '../plots/plots.controller';
import { PlotsService } from '../plots/plots.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_controller_scope_test';

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('Controller scope integration: farmer ownership enforcement', () => {
  let pool: Pool;
  let harvestService: HarvestService;
  let plotsService: PlotsService;
  let harvestController: HarvestController;
  let plotsController: PlotsController;

  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';
  const farmerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const farmerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const plotA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farmer_profile (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_account(id),
        country_code TEXT NOT NULL DEFAULT 'HN',
        self_declared BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES farmer_profile(id),
        name TEXT NOT NULL DEFAULT 'Test plot'
      )
    `);

    harvestService = new HarvestService(pool);
    plotsService = new PlotsService(pool, {} as any);
    harvestController = new HarvestController(harvestService);
    plotsController = new PlotsController(plotsService);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM plot');
    await pool.query('DELETE FROM farmer_profile');
    await pool.query('DELETE FROM user_account');

    await pool.query(
      `INSERT INTO user_account (id, role, name) VALUES ($1, 'farmer', 'A'), ($2, 'farmer', 'B')`,
      [userA, userB],
    );
    await pool.query(
      `INSERT INTO farmer_profile (id, user_id, country_code, self_declared, status)
       VALUES ($1, $2, 'HN', true, 'active'), ($3, $4, 'HN', true, 'active')`,
      [farmerA, userA, farmerB, userB],
    );
    await pool.query(`INSERT INTO plot (id, farmer_id, name) VALUES ($1, $2, 'Plot A')`, [plotA, farmerA]);
  });

  it('denies farmer voucher list for non-owned farmerId and allows own scope', async () => {
    const listSpy = jest.spyOn(harvestService, 'listVouchersForFarmer').mockResolvedValue([]);

    await expect(
      harvestController.listVouchers(farmerB, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.listVouchers(farmerA, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([]);

    expect(listSpy).toHaveBeenCalledWith(farmerA);
  });

  it('denies farmer plot list/update for non-owned entities and allows own scope', async () => {
    const listSpy = jest.spyOn(plotsService, 'listByFarmer').mockResolvedValue([]);
    const updateSpy = jest.spyOn(plotsService, 'updateMetadata').mockResolvedValue({ id: plotA, name: 'Renamed' } as any);

    await expect(
      plotsController.listByFarmer(farmerB, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.listByFarmer(farmerA, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([]);

    await expect(
      plotsController.updateMetadata(
        plotA,
        { name: 'Renamed', reason: 'scope-check' } as any,
        { user: { id: userB, email: 'farmer+other@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.updateMetadata(
        plotA,
        { name: 'Renamed', reason: 'scope-check' } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ id: plotA, name: 'Renamed' });

    expect(listSpy).toHaveBeenCalledWith(farmerA);
    expect(updateSpy).toHaveBeenCalledWith(plotA, { name: 'Renamed', reason: 'scope-check' }, userA);
  });
});
