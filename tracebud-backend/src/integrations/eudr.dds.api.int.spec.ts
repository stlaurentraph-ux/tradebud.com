import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { EudrController } from './eudr.controller';
import { PG_POOL } from '../db/db.module';
import { LaunchService } from '../launch/launch.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('EUDR DDS API integration', () => {
  let app: INestApplication;
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EudrController],
      providers: [
        {
          provide: PG_POOL,
          useValue: {
            query: jest.fn().mockResolvedValue({ rows: [] }),
          },
        },
        {
          provide: LaunchService,
          useValue: {
            requireFeatureAccess: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    createClientMock.mockReset();
    process.env = { ...originalEnv };
    process.env.SUPABASE_URL = 'https://supabase.example.test';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.EUDR_API_KEY = 'test_key';
    process.env.EUDR_API_VERSION = '2';
    process.env.EUDR_BASE_URL = 'https://www.eudr-api.eu';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    } as any);
  });

  afterAll(async () => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    await app.close();
  });

  it('returns 401 when bearer token is missing', async () => {
    const res = await request(app.getHttpServer()).post('/v1/integrations/eudr/dds').send({
      statement: { declarationType: 'import', referenceNumber: 'TB-REF-401' },
      idempotencyKey: 'idem_missing_token',
    });

    expect(res.status).toBe(401);
    expect(String(res.body.message ?? '')).toContain('Missing bearer token');
  });

  it('returns 403 when authenticated exporter attempts DDS submit', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              email: 'exporter+ops@tracebud.com',
              app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
            },
          },
          error: null,
        }),
      },
    } as any);

    const res = await request(app.getHttpServer())
      .post('/v1/integrations/eudr/dds')
      .set('authorization', 'Bearer exporter_token')
      .send({
        statement: { declarationType: 'import', referenceNumber: 'TB-REF-403' },
        idempotencyKey: 'idem_exporter_forbidden',
      });

    expect(res.status).toBe(403);
    expect(String(res.body.message ?? '')).toContain('Only importers/brands can submit EUDR DDS payloads');
  });

  it('returns 200 when importer/brand owner role submits DDS', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              email: 'importer+ops@tracebud.com',
              app_metadata: { tenant_id: 'tenant_1', role: 'compliance_manager' },
            },
          },
          error: null,
        }),
      },
    } as any);

    const res = await request(app.getHttpServer())
      .post('/v1/integrations/eudr/dds')
      .set('authorization', 'Bearer importer_token')
      .send({
        statement: { declarationType: 'import', referenceNumber: 'TB-REF-200' },
        idempotencyKey: 'idem_importer_ok',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        endpoint: '/api/eudr/dds',
        idempotencyKey: 'idem_importer_ok',
      }),
    );
  });
});
