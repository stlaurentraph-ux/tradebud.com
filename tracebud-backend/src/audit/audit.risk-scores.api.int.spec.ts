import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_audit_risk_scores_api_int_test';

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

describeIfDb('Audit risk-score API integration: phase/band filters', () => {
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.audit_log (
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
    await pool.query(
      `
        DELETE FROM audit_log
        WHERE event_type IN (
          'dds_package_risk_score_requested',
          'dds_package_risk_score_evaluated',
          'dds_package_risk_score_low',
          'dds_package_risk_score_medium',
          'dds_package_risk_score_high'
        )
      `,
    );
  });

  it('returns 403 when tenant claim is missing on risk-score reads', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/risk-scores');
    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('applies combined phase/band filters through HTTP pipeline', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_medium',
            '{"tenantId":"tenant_1","packageId":"pkg_1","provider":"internal_v1","score":45,"band":"medium","reasonCount":1}'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_high',
            '{"tenantId":"tenant_1","packageId":"pkg_2","provider":"internal_v1","score":82,"band":"high","reasonCount":2}'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'dds_package_risk_score_medium',
            '{"tenantId":"tenant_2","packageId":"pkg_3","provider":"internal_v1","score":50,"band":"medium","reasonCount":1}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/risk-scores')
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-id', '11111111-1111-1111-1111-111111111111')
      .set('x-user-email', 'exporter+demo@tracebud.com')
      .query({ fromHours: '720', phase: 'medium', band: 'medium', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'dds_package_risk_score_medium',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          band: 'medium',
          score: 45,
        }),
      }),
    );
  });

  it('exports filtered risk-score activity as csv with metadata headers', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_medium',
            '{"tenantId":"tenant_1","packageId":"pkg_1","exportedBy":"ops@tracebud.test","provider":"internal_v1","score":45,"band":"medium","reasonCount":1,"scoredAt":"2026-04-16T12:00:00.000Z"}'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_high',
            '{"tenantId":"tenant_1","packageId":"pkg_2","exportedBy":"ops@tracebud.test","provider":"internal_v1","score":82,"band":"high","reasonCount":2,"scoredAt":"2026-04-16T12:05:00.000Z"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/risk-scores/export')
      .set('x-tenant-id', 'tenant_1')
      .set('x-user-id', '11111111-1111-1111-1111-111111111111')
      .set('x-user-email', 'exporter+demo@tracebud.com')
      .query({ fromHours: '720', phase: 'medium', band: 'medium', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['x-export-row-limit']).toBe('5000');
    expect(res.headers['x-export-row-count']).toBe('1');
    expect(res.headers['x-export-truncated']).toBe('false');
    expect(res.text).toContain('captured_at,actor,phase,package_id,provider,band,score,reason_count,scored_at');
    expect(res.text).toContain('ops@tracebud.test,medium,pkg_1,internal_v1,medium,45,1');
  });
});
