import { Pool } from 'pg';
import { HarvestService } from './harvest.service';
import { PlotsService } from '../plots/plots.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_scope_test';

function withSearchPath(connectionString: string, targetSchema: string) {
  const separator = connectionString.includes('?') ? '&' : '?';
  const options = encodeURIComponent(`-c search_path=${targetSchema},public`);
  return `${connectionString}${separator}options=${options}`;
}

describeIfDb('Ownership scope integration: farmer/profile joins', () => {
  let pool: Pool;
  let harvestService: HarvestService;
  let plotsService: PlotsService;

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
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DROP TABLE IF EXISTS agent_plot_assignment');
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

  it('verifies farmer ownership for harvest/plots helpers', async () => {
    await expect(harvestService.isFarmerOwnedByUser(farmerA, userA)).resolves.toBe(true);
    await expect(harvestService.isFarmerOwnedByUser(farmerA, userB)).resolves.toBe(false);
    await expect(plotsService.isFarmerOwnedByUser(farmerA, userA)).resolves.toBe(true);
    await expect(plotsService.isFarmerOwnedByUser(farmerA, userB)).resolves.toBe(false);
  });

  it('verifies plot ownership by user via farmer_profile join', async () => {
    await expect(plotsService.isPlotOwnedByUser(plotA, userA)).resolves.toBe(true);
    await expect(plotsService.isPlotOwnedByUser(plotA, userB)).resolves.toBe(false);
  });
});
