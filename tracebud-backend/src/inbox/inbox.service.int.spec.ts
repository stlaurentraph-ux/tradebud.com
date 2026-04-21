import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { InboxService } from './inbox.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_inbox_service_int_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('InboxService integration: tenant/state boundaries', () => {
  jest.setTimeout(30_000);
  let pool: Pool;
  let service: InboxService;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    service = new InboxService(pool);

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
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DROP TABLE IF EXISTS inbox_request_events CASCADE');
    await pool.query('DROP TABLE IF EXISTS inbox_requests CASCADE');
    await pool.query(`DELETE FROM audit_log WHERE event_type IN ('inbox_requests_seeded', 'inbox_request_responded')`);
  });

  it('returns only recipient tenant requests after bootstrap', async () => {
    await service.bootstrap('reset');

    const ownTenant = await service.list('tenant_rwanda_001');
    const otherTenant = await service.list('tenant_brazil_001');

    expect(ownTenant.length).toBeGreaterThan(0);
    expect(ownTenant.every((row) => row.recipient_tenant_id === 'tenant_rwanda_001')).toBe(true);
    expect(otherTenant).toEqual([]);
  }, 20_000);

  it('respond transition is idempotent and cross-tenant respond is rejected', async () => {
    await service.bootstrap('reset');
    const requests = await service.list('tenant_rwanda_001');
    expect(requests.length).toBeGreaterThan(0);
    const requestId = requests[0].id;

    const first = await service.respond(requestId, 'tenant_rwanda_001');
    expect(first.status).toBe('RESPONDED');

    const second = await service.respond(requestId, 'tenant_rwanda_001');
    expect(second.status).toBe('RESPONDED');
    expect(second.id).toBe(first.id);

    await expect(service.respond(requestId, 'tenant_brazil_001')).rejects.toThrow(NotFoundException);
  }, 20_000);

  it('rejects list/respond without authenticated tenant context', async () => {
    await expect(service.list('')).rejects.toThrow(BadRequestException);
    await expect(service.respond('req_inbox_001', '')).rejects.toThrow(BadRequestException);
  });

  it('self-heals when inbox tables are dropped between calls', async () => {
    await service.bootstrap('reset');
    const initial = await service.list('tenant_rwanda_001');
    expect(initial.length).toBeGreaterThan(0);

    // Simulate external cleanup/race condition while service continues running.
    await pool.query('DROP TABLE IF EXISTS inbox_request_events CASCADE');
    await pool.query('DROP TABLE IF EXISTS inbox_requests CASCADE');

    const afterDrop = await service.list('tenant_rwanda_001');
    expect(afterDrop.length).toBeGreaterThan(0);
    expect(afterDrop.every((row) => row.recipient_tenant_id === 'tenant_rwanda_001')).toBe(true);

    const pending = afterDrop.find((row) => row.status === 'PENDING');
    expect(pending).toBeDefined();
    await expect(service.respond(pending!.id, 'tenant_rwanda_001')).resolves.toMatchObject({
      id: pending!.id,
      status: 'RESPONDED',
    });
  }, 60_000);
});
