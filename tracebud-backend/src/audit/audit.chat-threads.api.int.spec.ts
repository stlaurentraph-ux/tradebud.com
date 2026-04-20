import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_audit_chat_threads_api_int_test';

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

describeIfDb('Audit chat-threads API integration: phase filters', () => {
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
          'chat_thread_created',
          'chat_thread_message_posted',
          'chat_thread_message_replayed',
          'chat_thread_resolved',
          'chat_thread_reopened',
          'chat_thread_archived'
        )
      `,
    );
  });

  it('returns 403 when tenant claim is missing on chat-thread reads', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audit/gated-entry/chat-threads');

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
            'chat_thread_created',
            '{"tenantId":"tenant_1","threadId":"thread_1","recordId":"record_1","messageId":"msg_1","actorRole":"exporter"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'chat_thread_message_posted',
            '{"tenantId":"tenant_1","threadId":"thread_1","recordId":"record_1","messageId":"msg_2","actorRole":"agent"}'::jsonb
          ),
          (
            '88888888-8888-4888-8888-888888888888'::uuid,
            'chat_thread_created',
            '{"tenantId":"tenant_2","threadId":"thread_2","recordId":"record_2","messageId":"msg_3","actorRole":"exporter"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/chat-threads')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', phase: 'created', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'chat_thread_created',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          threadId: 'thread_1',
          messageId: 'msg_1',
        }),
      }),
    );
  });

  it('returns resolved phase rows when resolved is selected', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'chat_thread_resolved',
            '{"tenantId":"tenant_1","threadId":"thread_10","recordId":"record_10","messageId":"msg_resolve","actorRole":"exporter"}'::jsonb
          ),
          (
            '77777777-7777-4777-8777-777777777777'::uuid,
            'chat_thread_reopened',
            '{"tenantId":"tenant_1","threadId":"thread_10","recordId":"record_10","messageId":"msg_reopen","actorRole":"exporter"}'::jsonb
          )
      `,
    );

    const res = await request(app.getHttpServer())
      .get('/v1/audit/gated-entry/chat-threads')
      .set('x-tenant-id', 'tenant_1')
      .query({ fromHours: '720', phase: 'resolved', limit: '20', offset: '0', sort: 'desc' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'chat_thread_resolved',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          threadId: 'thread_10',
          messageId: 'msg_resolve',
        }),
      }),
    );
  });
});
