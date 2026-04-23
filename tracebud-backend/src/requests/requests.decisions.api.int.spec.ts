import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { PG_POOL } from '../db/db.module';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_requests_decisions_api_int_${process.pid}_${Date.now().toString(36)}`;
jest.setTimeout(60_000);

describeIfDb('Requests decisions API integration', () => {
  let pool: Pool;
  let app: INestApplication;
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: testDbUrl!,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS request_campaigns (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS request_campaign_recipient_decisions (
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('accept', 'refuse')),
        decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT NOT NULL DEFAULT 'email_cta',
        PRIMARY KEY (campaign_id, recipient_email)
      )
    `);

    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [RequestsService, { provide: PG_POOL, useValue: pool }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 25_000);

  afterAll(async () => {
    await app.close();
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  }, 20_000);

  beforeEach(async () => {
    createClientMock.mockReset();
    process.env.SUPABASE_URL = 'https://supabase.example.test';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query('DELETE FROM request_campaign_recipient_decisions');
    await pool.query('DELETE FROM request_campaigns');
  }, 20_000);

  it('returns 401 when bearer token is missing', async () => {
    const res = await request(app.getHttpServer()).get('/v1/requests/campaigns/camp_1/decisions');
    expect(res.status).toBe(401);
    expect(String(res.body.message ?? '')).toContain('Missing bearer token');
  });

  it('returns 401 when bearer token is invalid', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'jwt malformed' },
        }),
      },
    } as any);

    const res = await request(app.getHttpServer())
      .get('/v1/requests/campaigns/camp_1/decisions')
      .set('authorization', 'Bearer invalid_token');

    expect(res.status).toBe(401);
    expect(String(res.body.message ?? '')).toContain('Invalid token');
  });

  it('returns 403 when authenticated role is not allowed for request campaigns', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              app_metadata: { tenant_id: 'tenant_1', role: 'farmer' },
            },
          },
          error: null,
        }),
      },
    } as any);

    const res = await request(app.getHttpServer())
      .get('/v1/requests/campaigns/camp_1/decisions')
      .set('authorization', 'Bearer valid_but_forbidden_role');

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('This role cannot access request campaigns.');
  });

  it('returns tenant-scoped filtered paginated decision timeline over HTTP', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
            },
          },
          error: null,
        }),
      },
    } as any);

    await pool.query(`
      INSERT INTO request_campaigns (id, tenant_id)
      VALUES ('camp_1', 'tenant_1'), ('camp_other', 'tenant_other')
    `);
    await pool.query(`
      INSERT INTO request_campaign_recipient_decisions (
        campaign_id,
        recipient_email,
        decision,
        decided_at,
        source
      )
      VALUES
        ('camp_1', 'accept-1@example.com', 'accept', '2026-04-22T12:00:00.000Z', 'email_cta'),
        ('camp_1', 'accept-2@example.com', 'accept', '2026-04-22T11:00:00.000Z', 'email_cta'),
        ('camp_1', 'refuse-1@example.com', 'refuse', '2026-04-22T10:00:00.000Z', 'email_cta'),
        ('camp_other', 'other@example.com', 'accept', '2026-04-22T09:00:00.000Z', 'email_cta')
    `);

    const res = await request(app.getHttpServer())
      .get('/v1/requests/campaigns/camp_1/decisions?decision=accept&limit=1&offset=0')
      .set('authorization', 'Bearer demo_token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      campaign_id: 'camp_1',
      tenant_id: 'tenant_1',
      last_synced_at: '2026-04-22T12:00:00.000Z',
      counts: {
        all: 3,
        accept: 2,
        refuse: 1,
      },
      pagination: {
        decision: 'accept',
        limit: 1,
        offset: 0,
        returned: 1,
        has_more: true,
      },
      decisions: [
        {
          campaign_id: 'camp_1',
          recipient_email: 'accept-1@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:00:00.000Z',
          source: 'email_cta',
        },
      ],
    });
  });
});
