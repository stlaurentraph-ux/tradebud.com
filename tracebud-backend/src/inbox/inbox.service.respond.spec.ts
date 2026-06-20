import { InboxService } from './inbox.service';

describe('InboxService respond fulfillment', () => {
  it('records evidence payload and reconciles sender campaign on respond', async () => {
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('UPDATE inbox_requests')) {
        return {
          rowCount: 1,
          rows: [{
            id: 'req_1',
            campaign_id: 'camp_1',
            title: 'Upload FPIC',
            request_type: 'CONSENT_GRANT',
            due_at: '2026-05-01T00:00:00.000Z',
            from_org: 'Importer Org',
            sender_tenant_id: 'tenant_importer',
            recipient_tenant_id: 'tenant_exporter',
            status: 'RESPONDED',
            created_at: '2026-06-01T00:00:00.000Z',
            updated_at: '2026-06-03T00:00:00.000Z',
          }],
        };
      }

      if (normalized.includes('FROM tenant_signup_contacts')) {
        return { rows: [{ email: 'exporter@tracebud.test' }] };
      }

      if (normalized.includes('INSERT INTO request_campaign_recipient_decisions')) {
        return { rows: [{ campaign_id: 'camp_1' }] };
      }

      if (normalized.includes('UPDATE request_campaigns')) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const pool = { query };
    const service = new InboxService(pool as any);
    jest.spyOn(service as any, 'seedIfEmpty').mockResolvedValue(undefined);

    const result = await service.respond(
      'req_1',
      'tenant_exporter',
      {
        notes: 'FPIC packet uploaded',
        evidencePackageIds: ['pkg_1'],
      },
      'user_exporter',
    );

    expect(result.status).toBe('RESPONDED');
    const calls = query.mock.calls as unknown as Array<[string, unknown[] | undefined]>;
    expect(
      calls.some(([sql, params]) =>
        sql.includes('request_campaign_recipient_decisions') &&
        Array.isArray(params) &&
        params[0] === 'camp_1' &&
        params[1] === 'exporter@tracebud.test',
      ),
    ).toBe(true);
    expect(
      calls.some(([sql, params]) => {
        if (!sql.includes('inbox_request_events')) return false;
        const payload = JSON.parse(String(params?.[2] ?? '{}'));
        return payload.notes === 'FPIC packet uploaded' && payload.evidencePackageIds?.includes('pkg_1');
      }),
    ).toBe(true);
  });
});
