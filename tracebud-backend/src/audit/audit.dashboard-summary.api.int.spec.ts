import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_audit_dashboard_summary_api_int_test';

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

describeIfDb('Audit dashboard-summary API integration', () => {
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
    await pool.query(`DELETE FROM audit_log`);
  });

  it('returns 403 when tenant claim is missing on dashboard summary', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/dashboard-summary');

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('returns tenant-scoped diagnostics counters and readiness', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_1","gate":"request_campaigns"}'::jsonb),
          ('plot_assignment_export_requested', '{"tenantId":"tenant_1","status":"active"}'::jsonb),
          ('dds_package_risk_score_medium', '{"tenantId":"tenant_1","band":"medium"}'::jsonb),
          ('dds_package_submission_accepted', '{"tenantId":"tenant_1"}'::jsonb),
          ('chat_thread_message_posted', '{"tenantId":"tenant_1"}'::jsonb),
          ('chat_thread_message_posted', '{"tenantId":"tenant_2"}'::jsonb)
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/dashboard-summary')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '24' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      tenantId: 'tenant_1',
      fromHours: 24,
      totalDiagnostics: 5,
      counters: {
        gatedEntryAttempts: 1,
        assignmentExportEvents: 1,
        riskScoreEvents: 1,
        filingActivityEvents: 1,
        chatActivityEvents: 1,
      },
      breakdown: {
        assignmentPhase: { requested: 1, succeeded: 0, failed: 0 },
        assignmentStatus: { active: 1, completed: 0, cancelled: 0 },
        riskBand: { low: 0, medium: 1, high: 0 },
        filingFamily: { generation: 0, submission: 1 },
        chatPhase: { created: 0, posted: 1, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
      },
      readiness: {
        hasAnyDiagnostics: true,
        canExportDetailed: true,
        latestEventAt: expect.any(String),
      },
    });
  });

  it('returns non-export-ready summary for tenant with no diagnostics', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/dashboard-summary')
      .set('x-tenant-id', 'tenant_empty')
      .query({ fromHours: '24' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      tenantId: 'tenant_empty',
      fromHours: 24,
      totalDiagnostics: 0,
      counters: {
        gatedEntryAttempts: 0,
        assignmentExportEvents: 0,
        riskScoreEvents: 0,
        filingActivityEvents: 0,
        chatActivityEvents: 0,
      },
      breakdown: {
        assignmentPhase: { requested: 0, succeeded: 0, failed: 0 },
        assignmentStatus: { active: 0, completed: 0, cancelled: 0 },
        riskBand: { low: 0, medium: 0, high: 0 },
        filingFamily: { generation: 0, submission: 0 },
        chatPhase: { created: 0, posted: 0, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
      },
      readiness: {
        hasAnyDiagnostics: false,
        canExportDetailed: false,
        latestEventAt: null,
      },
    });
  });
});
