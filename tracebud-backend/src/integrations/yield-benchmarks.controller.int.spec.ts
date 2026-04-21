import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { YieldBenchmarksController } from './yield-benchmarks.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_yield_benchmarks_controller_test';

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('YieldBenchmarksController integration', () => {
  let pool: Pool;
  let controller: YieldBenchmarksController;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS yield_benchmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        commodity TEXT NOT NULL,
        geography TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK (source_type IN ('SPONSOR_OVERRIDE', 'NATIONAL_STATS', 'USDA_FAS', 'FAOSTAT')),
        source_reference TEXT NOT NULL,
        yield_lower_kg_ha NUMERIC(12,2) NOT NULL,
        yield_upper_kg_ha NUMERIC(12,2) NOT NULL,
        seasonality_factor NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
        review_cadence TEXT NOT NULL DEFAULT 'annual',
        active BOOLEAN NOT NULL DEFAULT FALSE,
        created_by_user_id UUID NULL,
        approved_by_user_id UUID NULL,
        approved_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT yield_benchmarks_bounds_check CHECK (yield_lower_kg_ha <= yield_upper_kg_ha)
      )
    `);
    controller = new YieldBenchmarksController(pool as any);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM yield_benchmarks');
  });

  const creatorReq = {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin+ops@tracebud.com',
      app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
    },
  };

  const approverReq = {
    user: {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'compliance+review@tracebud.com',
      app_metadata: { tenant_id: 'tenant_1', role: 'COMPLIANCE_MANAGER' },
    },
  };

  it('rejects list when tenant claim is missing', async () => {
    await expect(
      controller.listBenchmarks(undefined, {
        user: { id: 'user_1', email: 'exporter+ops@tracebud.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates draft, updates it, and lists it', async () => {
    const created = await controller.createBenchmark(
      {
        commodity: 'Cocoa',
        geography: 'Ghana',
        sourceType: 'FAOSTAT',
        sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
        yieldLowerKgHa: 250,
        yieldUpperKgHa: 900,
        seasonalityFactor: 1,
        reviewCadence: 'annual',
      },
      creatorReq,
    );
    expect(created.status).toBe('draft');

    const updated = await controller.updateBenchmark(
      created.id,
      {
        yieldUpperKgHa: 950,
      },
      creatorReq,
    );
    expect(updated.status).toBe('draft');

    const listed = await controller.listBenchmarks('false', creatorReq);
    expect(listed.items.length).toBe(1);
    expect(Number(listed.items[0].yield_upper_kg_ha)).toBe(950);
  });

  it('enforces dual-control and activates draft', async () => {
    const created = await controller.createBenchmark(
      {
        commodity: 'Soy',
        geography: 'Brazil',
        sourceType: 'USDA_FAS',
        sourceReference: 'https://apps.fas.usda.gov/psdonline/app/index.html#/app/advQuery',
        yieldLowerKgHa: 1800,
        yieldUpperKgHa: 4200,
        seasonalityFactor: 1,
        reviewCadence: 'annual',
      },
      creatorReq,
    );

    await expect(controller.activateBenchmark(created.id, creatorReq)).rejects.toThrow('Dual-control violation');

    const activated = await controller.activateBenchmark(created.id, approverReq);
    expect(activated).toEqual({ id: created.id, active: true, status: 'active' });

    const rows = await pool.query(`SELECT active, approved_by_user_id FROM yield_benchmarks WHERE id = $1`, [created.id]);
    expect(rows.rows[0].active).toBe(true);
    expect(rows.rows[0].approved_by_user_id).toBe(approverReq.user.id);
  });

  it('rejects non-citable source reference for FAOSTAT', async () => {
    await expect(
      controller.createBenchmark(
        {
          commodity: 'Cocoa',
          geography: 'Ghana',
          sourceType: 'FAOSTAT',
          sourceReference: 'seed-v1',
          yieldLowerKgHa: 250,
          yieldUpperKgHa: 900,
          seasonalityFactor: 1,
          reviewCadence: 'annual',
        },
        creatorReq,
      ),
    ).rejects.toThrow('sourceReference must be a citable URL or publication identifier');
  });
});
