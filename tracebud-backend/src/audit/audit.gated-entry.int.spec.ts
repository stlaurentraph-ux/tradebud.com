import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_audit_gated_entry_test';

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('AuditController integration: gated-entry telemetry listing', () => {
  let pool: Pool;
  let controller: AuditController;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

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

    controller = new AuditController(pool as any);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM audit_log');
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_1","gate":"request_campaigns"}'::jsonb),
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_2","gate":"annual_reporting"}'::jsonb),
          ('shipment_created', '{"tenantId":"tenant_1"}'::jsonb)
      `,
    );
  });

  it('rejects gated-entry list when tenant claim is missing', async () => {
    await expect(
      controller.listGatedEntry({ user: { id: 'user_1', email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns only dashboard gated-entry events for signed tenant claim', async () => {
    const rows = await controller.listGatedEntry({
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        event_type: 'dashboard_gated_entry_attempt',
        payload: expect.objectContaining({ tenantId: 'tenant_1' }),
      }),
    );
  });
});
