import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_audit_assignment_exports_api_int_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const readHeader = (name: string) => {
      const value = req.headers?.[name];
      if (Array.isArray(value)) return value[0];
      return value;
    };
    const tenantId = readHeader('x-tenant-id');
    const userId = readHeader('x-user-id') ?? '11111111-1111-4111-8111-111111111111';
    const email = readHeader('x-user-email') ?? 'exporter@example.com';
    req.user = {
      id: userId,
      email,
      app_metadata: tenantId ? { tenant_id: tenantId } : undefined,
    };
    return true;
  }
}

describeIfDb('Audit assignment-export API integration: phase/status filters', () => {
  let pool: Pool;
  let app: INestApplication;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
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
      controllers: [AuditController],
      providers: [{ provide: PG_POOL, useValue: pool }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 25_000);

  afterAll(async () => {
    await app.close();
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query(
      `
        DELETE FROM ${schema}.audit_log
        WHERE event_type IN (
          'plot_assignment_export_requested',
          'plot_assignment_export_succeeded',
          'plot_assignment_export_failed'
        )
      `,
    );
  });

  it('returns 403 when tenant claim is missing on assignment-export reads', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/assignment-exports');

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('applies combined phase/status filters through HTTP pipeline', async () => {
    await pool.query(
      `
        INSERT INTO ${schema}.audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{"tenantId":"tenant_1","plotId":"plot_1","status":"active","fromDays":14,"rowCount":0,"error":"timeout"}'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{"tenantId":"tenant_1","plotId":"plot_1","status":"cancelled","fromDays":14,"rowCount":0,"error":"cancelled"}'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_succeeded',
            '{"tenantId":"tenant_1","plotId":"plot_1","status":"active","fromDays":14,"rowCount":5,"error":null}'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'plot_assignment_export_failed',
            '{"tenantId":"tenant_2","plotId":"plot_2","status":"active","fromDays":30,"rowCount":0,"error":"timeout"}'::jsonb
          )
      `,
    );
    const seeded = await pool.query<{ total: number }>(
      `
        SELECT COUNT(*)::int AS total
        FROM ${schema}.audit_log
        WHERE event_type = 'plot_assignment_export_failed'
          AND payload ->> 'tenantId' = 'tenant_1'
          AND payload ->> 'status' = 'active'
      `,
    );
    expect(seeded.rows[0]?.total).toBe(1);

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/assignment-exports')
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-id', '11111111-1111-1111-1111-111111111111')
      .set('x-user-email', 'exporter+demo@tracebud.com')
      .query({ fromHours: '720', phase: 'failed', status: 'active', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'plot_assignment_export_failed',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          status: 'active',
          error: 'timeout',
        }),
      }),
    );
  });

  it('exports filtered assignment activity as csv with metadata headers', async () => {
    await pool.query(
      `
        INSERT INTO ${schema}.audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{"tenantId":"tenant_1","plotId":"plot_1","exportedBy":"ops@tracebud.test","status":"active","fromDays":14,"agentUserId":"agent_1","rowCount":0,"error":"timeout"}'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{"tenantId":"tenant_1","plotId":"plot_1","exportedBy":"ops@tracebud.test","status":"cancelled","fromDays":14,"agentUserId":"agent_1","rowCount":0,"error":"cancelled"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/assignment-exports/export')
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-id', '11111111-1111-1111-1111-111111111111')
      .set('x-user-email', 'exporter+demo@tracebud.com')
      .query({ fromHours: '720', phase: 'failed', status: 'active', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['x-export-row-limit']).toBe('5000');
    expect(res.headers['x-export-row-count']).toBe('1');
    expect(res.headers['x-export-truncated']).toBe('false');
    expect(res.text).toContain('captured_at,actor,phase,status,from_days,agent_user_id,row_count,error');
    expect(res.text).toContain('ops@tracebud.test,failed,active,14,agent_1,0,timeout');
  });
});
