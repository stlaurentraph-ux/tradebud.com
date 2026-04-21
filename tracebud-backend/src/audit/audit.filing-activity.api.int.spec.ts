import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_audit_filing_activity_api_int_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
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

describeIfDb('Audit filing-activity API integration: phase filters and export', () => {
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
          'dds_package_generation_requested',
          'dds_package_generation_generated',
          'dds_package_submission_requested',
          'dds_package_submission_accepted',
          'dds_package_submission_replayed'
        )
      `,
    );
  });

  it('returns 403 when tenant claim is missing on filing-activity reads', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/filing-activity');

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('applies phase filter through HTTP pipeline', async () => {
    await pool.query(
      `
        INSERT INTO ${schema}.audit_log (user_id, event_type, payload)
        VALUES
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'dds_package_generation_generated',
            '{"tenantId":"tenant_1","packageId":"pkg_1","status":"package_generated","artifactVersion":"v1","lotCount":2}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'dds_package_submission_accepted',
            '{"tenantId":"tenant_1","packageId":"pkg_1","submissionState":"submitted","tracesReference":"TRACES-1","replayed":false}'::jsonb
          ),
          (
            '88888888-8888-4888-8888-888888888888'::uuid,
            'dds_package_generation_generated',
            '{"tenantId":"tenant_2","packageId":"pkg_2","status":"package_generated","artifactVersion":"v1","lotCount":1}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/filing-activity')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', phase: 'generation_generated', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'dds_package_generation_generated',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          packageId: 'pkg_1',
          artifactVersion: 'v1',
        }),
      }),
    );
  });

  it('exports filtered filing activity as csv with metadata headers', async () => {
    await pool.query(
      `
        INSERT INTO ${schema}.audit_log (user_id, event_type, payload)
        VALUES
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'dds_package_generation_generated',
            '{"tenantId":"tenant_1","packageId":"pkg_1","exportedBy":"ops@tracebud.test","status":"package_generated","artifactVersion":"v1","lotCount":2,"generatedAt":"2026-04-16T12:00:00.000Z"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'dds_package_submission_accepted',
            '{"tenantId":"tenant_1","packageId":"pkg_1","exportedBy":"ops@tracebud.test","submissionState":"submitted","tracesReference":"TRACES-1","replayed":false,"persistedAt":"2026-04-16T12:05:00.000Z"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/filing-activity/export')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', phase: 'generation_generated', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['x-export-row-limit']).toBe('5000');
    expect(res.headers['x-export-row-count']).toBe('1');
    expect(res.headers['x-export-truncated']).toBe('false');
    expect(res.text).toContain(
      'captured_at,actor,phase,package_id,status,artifact_version,lot_count,idempotency_key,submission_state,traces_reference,replayed,persisted_at,generated_at',
    );
    expect(res.text).toContain('ops@tracebud.test,generation_generated,pkg_1,package_generated,v1,2');
  });
});
