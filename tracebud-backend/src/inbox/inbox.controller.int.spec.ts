import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_inbox_controller_int_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('InboxController integration: tenant claim + role policy', () => {
  let pool: Pool;
  let service: InboxService;
  let controller: InboxController;

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

    service = new InboxService(pool);
    controller = new InboxController(service);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DROP TABLE IF EXISTS inbox_request_events CASCADE');
    await pool.query('DROP TABLE IF EXISTS inbox_requests CASCADE');
    await service.bootstrap('reset');
  });

  it('rejects list/respond/bootstrap without signed tenant claim', async () => {
    await expect(controller.list({ user: { email: 'exporter+demo@tracebud.com' } })).rejects.toThrow(
      ForbiddenException,
    );

    await expect(
      controller.respond('req_inbox_001', { user: { email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.bootstrap(
        { action: 'reset' },
        { user: { email: 'exporter+demo@tracebud.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects bootstrap for non-exporter and allows exporter', async () => {
    await expect(
      controller.bootstrap(
        { action: 'seed_first_customer' },
        { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow('Only exporter/admin users can run inbox bootstrap actions.');

    await expect(
      controller.bootstrap(
        { action: 'seed_golden_path' },
        { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' } },
      ),
    ).resolves.toEqual({ ok: true });
  });

  it('enforces tenant scope on respond with DB-backed records', async () => {
    await controller.bootstrap(
      { action: 'reset' },
      { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' } },
    );

    const listed = await controller.list({
      user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' },
    });
    expect(listed.requests.length).toBeGreaterThan(0);

    const pending = listed.requests.find((item) => item.status === 'PENDING');
    expect(pending).toBeDefined();
    const requestId = pending!.id;
    await expect(
      controller.respond(requestId, {
        user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' },
      }),
    ).resolves.toMatchObject({
      request: expect.objectContaining({ id: requestId, status: 'RESPONDED' }),
    });

    await expect(
      controller.respond(requestId, {
        user: { app_metadata: { tenant_id: 'tenant_brazil_001' }, email: 'exporter+demo@tracebud.com' },
      }),
    ).rejects.toThrow(NotFoundException);
  }, 20_000);

  it('self-heals table state for controller list/respond after external table drop', async () => {
    await controller.bootstrap(
      { action: 'reset' },
      { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' } },
    );

    await pool.query('DROP TABLE IF EXISTS inbox_request_events CASCADE');
    await pool.query('DROP TABLE IF EXISTS inbox_requests CASCADE');

    const listed = await controller.list({
      user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' },
    });
    expect(listed.requests.length).toBeGreaterThan(0);

    const pending = listed.requests.find((item) => item.status === 'PENDING');
    expect(pending).toBeDefined();
    await expect(
      controller.respond(pending!.id, {
        user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' },
      }),
    ).resolves.toMatchObject({
      request: expect.objectContaining({ id: pending!.id, status: 'RESPONDED' }),
    });
  }, 20_000);
});
