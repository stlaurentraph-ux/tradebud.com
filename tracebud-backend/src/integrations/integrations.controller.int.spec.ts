import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { IntegrationsController } from './integrations.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_integrations_controller_test';

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('IntegrationsController integration', () => {
  let pool: Pool;
  let controller: IntegrationsController;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    controller = new IntegrationsController(pool as any);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query('DELETE FROM audit_log');
  });

  it('rejects list when tenant claim is missing', async () => {
    await expect(
      controller.listWebhooks(undefined, undefined, {
        user: { id: 'user_1', email: 'exporter+demo@tracebud.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns tenant-scoped webhook registration events', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          (
            'integration_webhook_registered',
            '{"tenantId":"tenant_1","webhookId":"11111111-1111-1111-1111-111111111111","endpointUrl":"https://hooks.one.test"}'::jsonb
          ),
          (
            'integration_webhook_registered',
            '{"tenantId":"tenant_2","webhookId":"22222222-2222-2222-2222-222222222222","endpointUrl":"https://hooks.two.test"}'::jsonb
          )
      `,
    );
    const result = await controller.listWebhooks('20', '0', {
      user: { id: 'user_1', email: 'agent+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'integration_webhook_registered',
        payload: expect.objectContaining({ tenantId: 'tenant_1' }),
      }),
    );
  });

  it('returns tenant-scoped webhook delivery evidence', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          (
            'integration_delivery_succeeded',
            '{"tenantId":"tenant_1","webhookId":"11111111-1111-1111-1111-111111111111","status":"succeeded"}'::jsonb
          ),
          (
            'integration_delivery_terminal_failed',
            '{"tenantId":"tenant_2","webhookId":"11111111-1111-1111-1111-111111111111","status":"terminal_failed"}'::jsonb
          )
      `,
    );
    const result = await controller.listWebhookDeliveries('11111111-1111-1111-1111-111111111111', '20', '0', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'integration_delivery_succeeded',
        payload: expect.objectContaining({ tenantId: 'tenant_1' }),
      }),
    );
  });
});

