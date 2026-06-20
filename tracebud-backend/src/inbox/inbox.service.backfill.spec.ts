import { InboxService } from './inbox.service';

describe('InboxService signup backfill', () => {
  it('creates inbox rows for campaigns sent before recipient signup', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'campaign_1',
            tenant_id: 'tenant_exporter',
            title: 'Upload FPIC',
            request_type: 'CONSENT_GRANT',
            due_at: '2026-05-01T00:00:00.000Z',
            target_contact_emails: ['importer@example.com'],
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ organization_name: 'Exporter Org' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'req_campaign_1_tenant_importer' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const pool = { query };
    const service = new InboxService(pool as any);
    const result = await service.backfillInboxForSignupContact({
      email: 'importer@example.com',
      recipientTenantId: 'tenant_importer',
    });

    expect(result.created).toBe(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO inbox_requests'),
      expect.arrayContaining(['req_campaign_1_tenant_importer', 'campaign_1', 'tenant_importer']),
    );
  });
});
