import { Pool } from 'pg';
import { resolveTenantIdForContactEmail } from './email-to-tenant-resolution';

function makePool(queryImpl: (...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>): Pool {
  return { query: jest.fn().mockImplementation(queryImpl) } as unknown as Pool;
}

describe('email-to-tenant-resolution', () => {
  it('falls back to admin_users when signup contact is missing', async () => {
    const pool = makePool(async (sql: unknown) => {
      const text = String(sql);
      if (text.includes('tenant_signup_contacts')) {
        return { rows: [], rowCount: 0 };
      }
      if (text.includes('admin_users')) {
        return {
          rows: [{ email: 'ops@example.com', tenant_id: 'tenant_admin' }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(resolveTenantIdForContactEmail(pool, 'ops@example.com')).resolves.toBe(
      'tenant_admin',
    );
  });
});
