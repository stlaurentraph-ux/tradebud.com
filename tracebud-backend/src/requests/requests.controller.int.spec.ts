import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_requests_controller_test_${process.pid}_${Date.now().toString(36)}`;

describeIfDb('RequestsController integration: decision timeline', () => {
  let pool: Pool;
  let controller: RequestsController;

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

    const service = new RequestsService(pool as any);
    controller = new RequestsController(service);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query('DELETE FROM request_campaign_recipient_decisions');
    await pool.query('DELETE FROM request_campaigns');
  });

  it('rejects decision timeline request when tenant claim is missing', async () => {
    await expect(
      controller.listDecisions({
        user: {
          id: 'user_1',
          app_metadata: { role: 'admin' },
        },
      } as any,
      'camp_1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns tenant-scoped filtered and paginated decision timeline payload', async () => {
    await pool.query(
      `
        INSERT INTO request_campaigns (id, tenant_id)
        VALUES ('camp_1', 'tenant_1'), ('camp_other', 'tenant_other')
      `,
    );
    await pool.query(
      `
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
      `,
    );

    const result = await controller.listDecisions(
      {
        user: {
          id: 'user_1',
          app_metadata: { role: 'admin', tenant_id: 'tenant_1' },
        },
      } as any,
      'camp_1',
      'accept',
      '1',
      '0',
    );

    expect(result).toEqual({
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
