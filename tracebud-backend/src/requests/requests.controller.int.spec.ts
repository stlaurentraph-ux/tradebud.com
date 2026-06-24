import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { InboxService } from '../inbox/inbox.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { requireTestDatabaseUrl } from '../testing/require-test-database-url';

const testDbUrl = requireTestDatabaseUrl();

const schema = `tb_requests_controller_test_${process.pid}_${Date.now().toString(36)}`;

describe('RequestsController integration: decision timeline', () => {
  let pool: Pool;
  let controller: RequestsController;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: testDbUrl!,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA ${schema}`);
    await pool.query(`SET search_path TO ${schema}`);
    await pool.query(`
      CREATE TABLE request_campaigns (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        target_contact_emails TEXT[] NOT NULL DEFAULT '{}',
        target_contact_ids TEXT[] NOT NULL DEFAULT '{}',
        require_farmer_app_confirmation BOOLEAN NOT NULL DEFAULT false
      )
    `);
    await pool.query(`
      CREATE TABLE request_campaign_recipient_decisions (
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('accept', 'refuse')),
        decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT NOT NULL DEFAULT 'email_cta',
        fulfillment_source TEXT,
        contact_id TEXT,
        PRIMARY KEY (campaign_id, recipient_email)
      )
    `);

    const inboxService = new InboxService(pool as any);
    const consentService = { canTenantAccessFarmerEvidence: jest.fn().mockResolvedValue(true) };
    const service = new RequestsService(pool as any, inboxService, consentService as any);
    controller = new RequestsController(service);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema}`);
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
      'all',
      '20',
      '0',
    );

    expect(result.campaign_id).toBe('camp_1');
    expect(result.tenant_id).toBe('tenant_1');
    expect(result.counts).toEqual({ all: 3, accept: 2, refuse: 1 });
    expect(result.recipients).toHaveLength(3);
    expect(result.recipient_status_counts).toEqual({
      fulfilled: 0,
      accepted: 2,
      refused: 1,
      signed_up: 0,
      invite_sent: 0,
      on_platform: 0,
    });
    expect(result.pagination).toEqual({
      decision: 'all',
      limit: 20,
      offset: 0,
      returned: 0,
      has_more: true,
    });
  });
});
