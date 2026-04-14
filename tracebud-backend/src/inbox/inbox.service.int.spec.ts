import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { InboxService } from './inbox.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;

function withSearchPath(connectionString: string, targetSchema: string) {
  const separator = connectionString.includes('?') ? '&' : '?';
  const options = encodeURIComponent(`-c search_path=${targetSchema},public`);
  return `${connectionString}${separator}options=${options}`;
}

describeIfDb('InboxService integration: tenant/state boundaries', () => {
  let pool: Pool;
  let service: InboxService;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, 'public'),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
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
    await pool.query('DROP TABLE IF EXISTS inbox_request_events');
    await pool.query('DROP TABLE IF EXISTS inbox_requests');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DROP TABLE IF EXISTS inbox_request_events');
    await pool.query('DROP TABLE IF EXISTS inbox_requests');
    await pool.query(`DELETE FROM audit_log WHERE event_type IN ('inbox_requests_seeded', 'inbox_request_responded')`);
  });

  it('returns only recipient tenant requests after bootstrap', async () => {
    await service.bootstrap('reset');

    const ownTenant = await service.list('tenant_rwanda_001');
    const otherTenant = await service.list('tenant_brazil_001');

    expect(ownTenant.length).toBeGreaterThan(0);
    expect(ownTenant.every((row) => row.recipient_tenant_id === 'tenant_rwanda_001')).toBe(true);
    expect(otherTenant).toEqual([]);
  });

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
});
