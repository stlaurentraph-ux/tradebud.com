import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { GfwService } from '../compliance/gfw.service';
import { PlotsController } from './plots.controller';
import { PlotsService } from './plots.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_plots_sync_api_int_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const readHeader = (name: string): string | undefined => {
      const raw = req.headers[name];
      if (Array.isArray(raw)) return raw[0];
      if (typeof raw === 'string') return raw;
      return undefined;
    };
    const tenantId = readHeader('x-tenant-id');
    const userId = readHeader('x-user-id') ?? '11111111-1111-4111-8111-111111111111';
    const email = readHeader('x-user-email') ?? 'farmer@example.com';
    req.user = {
      id: userId,
      email,
      app_metadata: tenantId ? { tenant_id: tenantId } : undefined,
    };
    return true;
  }
}

describeIfDb('Plots sync API integration: tenant + HLC envelope', () => {
  let pool: Pool;
  let app: INestApplication;
  let plotsService: PlotsService;
  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';
  const farmerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plotId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.farmer_profile (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES ${schema}.user_account(id),
        country_code TEXT NOT NULL DEFAULT 'HN',
        self_declared BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES ${schema}.farmer_profile(id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.agent_plot_assignment (
        assignment_id TEXT PRIMARY KEY,
        agent_user_id UUID NOT NULL REFERENCES ${schema}.user_account(id),
        plot_id UUID NOT NULL REFERENCES ${schema}.plot(id),
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);

    const moduleRef = await Test.createTestingModule({
      controllers: [PlotsController],
      providers: [
        PlotsService,
        { provide: PG_POOL, useValue: pool },
        {
          provide: GfwService,
          useValue: {
            runGeometryQuery: jest.fn(),
            runRaddFallback: jest.fn(),
            runHistoricalDeforestationQuery: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    plotsService = moduleRef.get(PlotsService);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  }, 25_000);

  afterAll(async () => {
    await app.close();
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query(`DELETE FROM ${schema}.audit_log`);
    await pool.query(`DELETE FROM ${schema}.agent_plot_assignment`);
    await pool.query(`DELETE FROM ${schema}.plot`);
    await pool.query(`DELETE FROM ${schema}.farmer_profile`);
    await pool.query(`DELETE FROM ${schema}.user_account`);
    await pool.query(
      `INSERT INTO ${schema}.user_account (id, role, name) VALUES ($1, 'farmer', 'A'), ($2, 'farmer', 'B')`,
      [userA, userB],
    );
    await pool.query(
      `INSERT INTO ${schema}.farmer_profile (id, user_id, country_code, self_declared, status)
       VALUES ($1, $2, 'HN', true, 'active')`,
      [farmerA, userA],
    );
    await pool.query(`INSERT INTO ${schema}.plot (id, farmer_id) VALUES ($1, $2)`, [plotId, farmerA]);
    await pool.query(
      `INSERT INTO ${schema}.agent_plot_assignment (assignment_id, agent_user_id, plot_id, status) VALUES ($1, $2, $3, 'active'), ($4, $5, $6, 'active')`,
      ['assign_agent_plot_a', userB, plotId, 'assign_agent_plot_a_owner', userA, plotId],
    );
  });

  it('returns 403 for missing tenant claim before sync writes', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/plots/${plotId}/photos-sync`)
      .set('x-user-email', 'farmer@example.com')
      .send({
        kind: 'ground_truth',
        photos: [],
        hlcTimestamp: '1712524800000:000001',
        clientEventId: 'evt-photo-deny-1',
      });

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');

    const auditRows = await pool.query(
      `SELECT id FROM ${schema}.audit_log WHERE event_type = 'plot_photos_synced'`,
    );
    expect(auditRows.rowCount).toBe(0);
  });

  it('returns 400 when sync envelope HLC is malformed', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/plots/${plotId}/legal-sync`)
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-email', 'farmer@example.com')
      .set('x-user-id', userA)
      .send({
        reason: 'title update',
        hlcTimestamp: 'bad-hlc-format',
        clientEventId: 'evt-legal-bad-1',
      });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
    expect((res.body.message as string[]).join(' ')).toContain(
      'hlcTimestamp must be in <ms>:<logical> format',
    );
  });

  it('accepts valid envelope and persists idempotency metadata in audit payload', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/plots/${plotId}/photos-sync`)
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-email', 'agent+field@example.com')
      .set('x-user-id', userB)
      .send({
        kind: 'ground_truth',
        photos: [{ uri: 'file://photo-1.jpg' }],
        note: 'evidence upload',
        hlcTimestamp: '1712524800000:000123',
        clientEventId: 'evt-evidence-ok-1',
        assignmentId: 'assign_agent_plot_a',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });

    const auditRows = await pool.query<{ payload: any }>(
      `
        SELECT payload
        FROM ${schema}.audit_log
        WHERE event_type = 'plot_photos_synced'
          AND payload->>'clientEventId' = 'evt-evidence-ok-1'
        UNION ALL
        SELECT payload
        FROM public.audit_log
        WHERE event_type = 'plot_photos_synced'
          AND payload->>'clientEventId' = 'evt-evidence-ok-1'
        LIMIT 1
      `,
    );
    expect(auditRows.rowCount).toBe(1);
    expect(auditRows.rows[0].payload).toEqual(
      expect.objectContaining({
        plotId,
        hlcTimestamp: '1712524800000:000123',
        clientEventId: 'evt-evidence-ok-1',
      }),
    );
  });

  it('returns 403 for farmer foreign-plot scope and for agent assignment mismatch', async () => {
    const denied = await request(app.getHttpServer())
      .post(`/v1/plots/${plotId}/photos-sync`)
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-email', 'farmer+other@example.com')
      .set('x-user-id', userB)
      .send({
        kind: 'ground_truth',
        photos: [],
        hlcTimestamp: '1712524800000:000010',
        clientEventId: 'evt-foreign-farmer',
      });
    expect(denied.status).toBe(403);
    expect(String(denied.body.message ?? '')).toContain('Plot scope violation');

    const deniedAgent = await request(app.getHttpServer())
      .post(`/v1/plots/${plotId}/photos-sync`)
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-email', 'agent+field@example.com')
      .set('x-user-id', userA)
      .send({
        kind: 'ground_truth',
        photos: [],
        hlcTimestamp: '1712524800000:000011',
        clientEventId: 'evt-agent-allow',
        assignmentId: 'assign_agent_plot_unknown',
      });
    expect(deniedAgent.status).toBe(403);
    expect(String(deniedAgent.body.message ?? '')).toContain('Assignment scope violation');
  });

  it('returns deforestation decision history events from persisted audit rows', async () => {
    await pool.query(
      `
        INSERT INTO ${schema}.audit_log (event_type, payload, user_id)
        VALUES ('plot_deforestation_decision_recorded', $1::jsonb, $2::uuid)
      `,
      [
        JSON.stringify({
          plotId,
          cutoffDate: '2020-12-31',
          verdict: 'no_deforestation_detected',
          providerMode: 'glad_s2_primary',
          summary: {
            alertCount: 0,
            alertAreaHa: 0,
          },
        }),
        userA,
      ],
    );

    const rows = await plotsService.getDeforestationDecisionHistory(plotId);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        event_type: 'plot_deforestation_decision_recorded',
        payload: expect.objectContaining({
          plotId,
          cutoffDate: '2020-12-31',
          verdict: 'no_deforestation_detected',
        }),
      }),
    );
  });
});
