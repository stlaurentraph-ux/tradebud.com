import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_audit_gated_entry_actors_api_int_test';

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

describeIfDb('Audit gated-entry actors API integration', () => {
  let pool: Pool;
  let app: INestApplication;

  const actorOne = '77777777-7777-4777-8777-777777777777';
  const actorTwo = '88888888-8888-4888-8888-888888888888';

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
      CREATE TABLE IF NOT EXISTS ${schema}.user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'exporter',
        name TEXT NULL
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'exporter',
        name TEXT NULL
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
    await pool.query(`DELETE FROM audit_log WHERE event_type = 'dashboard_gated_entry_exported'`);
  });

  it('returns 403 when tenant claim is missing', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/actors').query({ ids: actorOne });

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Missing tenant claim');
  });

  it('returns 400 when ids are missing or malformed', async () => {
    const missingIdsRes = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/actors')
      .set('x-tenant-id', 'tenant_1');
    expect(missingIdsRes.status).toBe(400);
    expect(String(missingIdsRes.body.message ?? '')).toContain('ids is required.');

    const invalidIdsRes = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/actors')
      .set('x-tenant-id', 'tenant_1')
      .query({ ids: 'not-a-uuid' });
    expect(invalidIdsRes.status).toBe(400);
    expect(String(invalidIdsRes.body.message ?? '')).toContain('ids must be UUID values.');
  });

  it('returns tenant-scoped actor labels and user fallbacks', async () => {
    await pool.query(
      `
        INSERT INTO user_account (id, role, name)
        VALUES
          ($1::uuid, 'exporter', 'Ops One'),
          ($2::uuid, 'exporter', NULL)
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role,
            name = EXCLUDED.name
      `,
      [actorOne, actorTwo],
    );
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            $1::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_1","exportedBy":"ops.one@tracebud.test"}'::jsonb
          ),
          (
            $2::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_1"}'::jsonb
          ),
          (
            $1::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_2","exportedBy":"other-tenant@tracebud.test"}'::jsonb
          )
      `,
      [actorOne, actorTwo],
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/actors')
      .set('x-tenant-id', 'tenant_1')
      .query({ ids: `${actorOne},${actorTwo}` });

    expect(res.status).toBe(200);
    expect(res.body.actors).toEqual({
      [actorOne]: 'ops.one@tracebud.test',
      [actorTwo]: 'user:88888888-8888-4888-8888-888888888888',
    });
  });
});
