import { InboxService } from './inbox.service';

describe('InboxService email CTA accept inbox ensure', () => {
  it('creates inbox row when recipient tenant resolves after email accept', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'campaign_1',
            tenant_id: 'tenant_importer',
            title: 'Upload plot geometry',
            request_type: 'MISSING_PLOT_GEOMETRY',
            due_at: '2026-05-01T00:00:00.000Z',
            target_contact_emails: ['exporter@tracebud.test'],
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ email: 'exporter@tracebud.test', tenant_id: 'tenant_exporter' }],
      })
      .mockResolvedValueOnce({ rows: [{ organization_name: 'Importer Org' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'req_campaign_1_tenant_exporter' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const pool = { query };
    const service = new InboxService(pool as any);
    jest.spyOn(service as any, 'ensureSchemaVerified').mockResolvedValue(undefined);

    const result = await service.ensureInboxFromEmailCtaAccept({
      campaignId: 'campaign_1',
      recipientEmail: 'exporter@tracebud.test',
    });

    expect(result).toEqual({ created: 1, skippedUnresolved: 0, skippedSelfTenant: 0 });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO inbox_requests'),
      expect.arrayContaining(['req_campaign_1_tenant_exporter', 'campaign_1', 'tenant_exporter']),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO inbox_request_events'),
      expect.arrayContaining(['req_campaign_1_tenant_exporter', 'REQUEST_CREATED_FROM_EMAIL_CTA_ACCEPT']),
    );
  });

  it('skips inbox creation when recipient tenant cannot be resolved', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'campaign_1',
            tenant_id: 'tenant_importer',
            title: 'Upload plot geometry',
            request_type: 'MISSING_PLOT_GEOMETRY',
            due_at: '2026-05-01T00:00:00.000Z',
            target_contact_emails: ['unknown@tracebud.test'],
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const pool = { query };
    const service = new InboxService(pool as any);
    jest.spyOn(service as any, 'ensureSchemaVerified').mockResolvedValue(undefined);

    const result = await service.ensureInboxFromEmailCtaAccept({
      campaignId: 'campaign_1',
      recipientEmail: 'unknown@tracebud.test',
    });

    expect(result).toEqual({ created: 0, skippedUnresolved: 1, skippedSelfTenant: 0 });
    expect(query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO inbox_requests'), expect.anything());
  });
});
