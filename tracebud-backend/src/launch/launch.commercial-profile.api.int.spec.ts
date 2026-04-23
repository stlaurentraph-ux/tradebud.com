import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { LaunchPublicController } from './launch.public.controller';
import { LaunchService } from './launch.service';
import { PG_POOL } from '../db/db.module';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_launch_commercial_profile_api_int_test';

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('Launch commercial-profile API integration', () => {
  let pool: Pool;
  let app: INestApplication;
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.tenant_commercial_profiles (
        tenant_id TEXT PRIMARY KEY,
        organization_name TEXT NULL,
        country TEXT NULL,
        primary_role TEXT NULL,
        team_size TEXT NULL,
        main_commodity TEXT NULL,
        primary_objective TEXT NULL,
        profile_skipped BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const moduleRef = await Test.createTestingModule({
      controllers: [LaunchPublicController],
      providers: [LaunchService, { provide: PG_POOL, useValue: pool }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 25_000);

  afterAll(async () => {
    await app.close();
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    createClientMock.mockReset();
    process.env.SUPABASE_URL = 'https://supabase.example.test';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    await pool.query(`DELETE FROM tenant_commercial_profiles`);
  });

  it('fails when authorization header is missing', async () => {
    const res = await request(app.getHttpServer()).post('/v1/launch/commercial-profile').send({
      skipped: true,
      primaryRole: 'importer',
    });
    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Authorization header is required.');
  });

  it('persists tenant-scoped commercial profile for authenticated actor', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              app_metadata: { tenant_id: 'tenant_1' },
            },
          },
          error: null,
        }),
      },
    } as any);

    const res = await request(app.getHttpServer())
      .post('/v1/launch/commercial-profile')
      .set('authorization', 'Bearer demo_token')
      .send({
        skipped: false,
        primaryRole: 'importer',
        teamSize: '11-50',
        mainCommodity: 'coffee',
        primaryObjective: 'risk_screening',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.profile.tenant_id).toBe('tenant_1');
    expect(res.body.profile.team_size).toBe('11-50');
    expect(res.body.profile.main_commodity).toBe('coffee');
    expect(res.body.profile.primary_objective).toBe('risk_screening');
  });
});
