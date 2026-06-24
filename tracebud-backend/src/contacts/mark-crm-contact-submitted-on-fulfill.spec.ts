import { markCrmContactSubmittedOnFulfill } from './mark-crm-contact-submitted-on-fulfill';

describe('markCrmContactSubmittedOnFulfill', () => {
  it('updates engaged CRM contact by recipient email', async () => {
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('UPDATE crm_contacts') && normalized.includes('lower(email)')) {
        return { rows: [{ id: 'contact_1' }] };
      }
      if (normalized.includes('INSERT INTO audit_log')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    const pool = { query };

    const result = await markCrmContactSubmittedOnFulfill(pool as any, {
      senderTenantId: 'tenant_exporter',
      recipientEmail: 'Supplier@Example.com',
      source: 'inbox_fulfillment',
      campaignId: 'camp_1',
    });

    expect(result).toEqual({ updated: true, contactId: 'contact_1' });
    const calls = query.mock.calls as unknown as Array<[string, unknown[] | undefined]>;
    expect(
      calls.some(([sql, params]) =>
        String(sql).includes('lower(email)') &&
        params?.[0] === 'tenant_exporter' &&
        params?.[1] === 'supplier@example.com',
      ),
    ).toBe(true);
  });

  it('updates engaged CRM contact by farmer profile id', async () => {
    const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('farmer_profile_id')) {
        return { rows: [{ id: 'contact_farmer' }] };
      }
      if (normalized.includes('INSERT INTO audit_log')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    const pool = { query };

    const result = await markCrmContactSubmittedOnFulfill(pool as any, {
      senderTenantId: 'tenant_coop',
      farmerProfileId: farmerId,
      source: 'consent_grant_approved',
      consentGrantId: 'grant_1',
    });

    expect(result).toEqual({ updated: true, contactId: 'contact_farmer' });
  });

  it('no-ops when no engaged contact matches', async () => {
    const query = jest.fn(async () => ({ rows: [] }));
    const pool = { query };

    const result = await markCrmContactSubmittedOnFulfill(pool as any, {
      senderTenantId: 'tenant_exporter',
      recipientEmail: 'missing@example.com',
      source: 'inbox_fulfillment',
    });

    expect(result).toEqual({ updated: false, contactId: null });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
