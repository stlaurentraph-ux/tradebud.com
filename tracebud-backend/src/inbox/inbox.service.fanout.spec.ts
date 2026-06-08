import { InboxService } from './inbox.service';

describe('InboxService campaign fan-out', () => {
  it('creates inbox rows for resolved recipient tenants and skips sender tenant', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [{ email: 'exporter@tracebud.test', tenant_id: 'tenant_exporter' }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'req_camp_1_tenant_exporter' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const pool = { query };
    const service = new InboxService(pool as any);
    jest.spyOn(service as any, 'ensureSchemaVerified').mockResolvedValue(undefined);

    const result = await service.fanOutFromCampaignSend({
      campaign: {
        id: 'camp_1',
        tenant_id: 'tenant_importer',
        title: 'Upload plot geometry',
        request_type: 'MISSING_PLOT_GEOMETRY',
        due_at: '2026-05-01T00:00:00.000Z',
        target_contact_emails: ['exporter@tracebud.test', 'unknown@tracebud.test'],
      },
      fromOrg: 'Acme Import',
    });

    expect(result).toEqual({ created: 1, skippedUnresolved: 1, skippedSelfTenant: 0 });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO inbox_requests'),
      expect.arrayContaining(['req_camp_1_tenant_exporter', 'camp_1', 'tenant_exporter']),
    );
  });

  it('skips recipients that resolve to the sender tenant', async () => {
    const query = jest.fn().mockResolvedValueOnce({
      rows: [{ email: 'ops@tracebud.test', tenant_id: 'tenant_importer' }],
    });

    const pool = { query };
    const service = new InboxService(pool as any);
    jest.spyOn(service as any, 'ensureSchemaVerified').mockResolvedValue(undefined);

    const result = await service.fanOutFromCampaignSend({
      campaign: {
        id: 'camp_self',
        tenant_id: 'tenant_importer',
        title: 'Self request',
        request_type: 'GENERAL_EVIDENCE',
        due_at: '2026-05-01T00:00:00.000Z',
        target_contact_emails: ['ops@tracebud.test'],
      },
      fromOrg: 'Acme Import',
    });

    expect(result).toEqual({ created: 0, skippedUnresolved: 0, skippedSelfTenant: 1 });
  });
});
