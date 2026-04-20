import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_audit_workflow_activity_api_int_test_${process.pid}_${Date.now().toString(36)}`;

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

describeIfDb('Audit workflow-activity API integration: phase and slaState filters', () => {
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
          'workflow_template_created',
          'workflow_stage_transitioned',
          'workflow_stage_sla_warning',
          'workflow_stage_sla_breached',
          'workflow_stage_sla_escalated',
          'workflow_stage_sla_recovered'
        )
      `,
    );
  });

  it('returns 403 when tenant claim is missing on workflow-activity reads', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/workflow-activity');

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('applies phase filter through HTTP pipeline', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'workflow_stage_sla_warning',
            '{"tenantId":"tenant_1","templateId":"template_1","stageId":"verify_docs","slaState":"warning","actorRole":"exporter"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'workflow_stage_transitioned',
            '{"tenantId":"tenant_1","templateId":"template_1","stageId":"verify_docs","fromStatus":"pending","toStatus":"in_progress","actorRole":"agent"}'::jsonb
          ),
          (
            '88888888-8888-4888-8888-888888888888'::uuid,
            'workflow_stage_sla_warning',
            '{"tenantId":"tenant_2","templateId":"template_2","stageId":"review_docs","slaState":"warning","actorRole":"exporter"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/workflow-activity')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', phase: 'sla_warning', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'workflow_stage_sla_warning',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          templateId: 'template_1',
          stageId: 'verify_docs',
          slaState: 'warning',
        }),
      }),
    );
  });

  it('applies slaState filter together with tenant scoping', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'workflow_stage_sla_warning',
            '{"tenantId":"tenant_1","templateId":"template_1","stageId":"verify_docs","slaState":"warning","actorRole":"exporter"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'workflow_stage_sla_breached',
            '{"tenantId":"tenant_1","templateId":"template_1","stageId":"verify_docs","slaState":"breached","actorRole":"exporter"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'workflow_stage_sla_escalated',
            '{"tenantId":"tenant_1","templateId":"template_1","stageId":"verify_docs","slaState":"escalated","actorRole":"exporter"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/workflow-activity')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', slaState: 'breached', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'workflow_stage_sla_breached',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          slaState: 'breached',
        }),
      }),
    );
  });
});
