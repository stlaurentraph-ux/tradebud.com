import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';

function createRequestsService(pool: unknown) {
  const inboxService = {
    fanOutFromCampaignSend: jest.fn().mockResolvedValue({
      created: 0,
      skippedUnresolved: 0,
      skippedSelfTenant: 0,
    }),
    ensureInboxFromEmailCtaAccept: jest.fn().mockResolvedValue({
      created: 1,
      skippedUnresolved: 0,
      skippedSelfTenant: 0,
    }),
  };
  const consentService = {
    canTenantAccessFarmerEvidence: jest.fn().mockResolvedValue(true),
  };
  return {
    service: new RequestsService(pool as any, inboxService as any, consentService as any),
    inboxService,
  };
}

function mockListDecisionsPoolQueries(
  pool: { query: jest.Mock },
  input: {
    campaign?: { id: string; tenant_id: string; target_contact_emails?: string[] };
    counts?: { all_count: string; accept_count: string; refuse_count: string };
    timelineDecisions?: Array<Record<string, unknown>>;
    invites?: Array<Record<string, unknown>>;
    paginatedDecisions?: Array<Record<string, unknown>>;
  },
) {
  pool.query
    .mockResolvedValueOnce({
      rows: [
        {
          target_contact_emails: [],
          ...input.campaign,
        },
      ],
    })
    .mockResolvedValueOnce({
      rows: [input.counts ?? { all_count: '0', accept_count: '0', refuse_count: '0' }],
    })
    .mockResolvedValueOnce({
      rows: input.timelineDecisions ?? [],
    })
    .mockResolvedValueOnce({
      rows: input.invites ?? [],
    })
    .mockResolvedValueOnce({
      rows: input.paginatedDecisions ?? [],
    });
}

describe('RequestsService', () => {
  it('lists recipient decisions for a tenant-scoped campaign in descending order', async () => {
    const pool = { query: jest.fn() };
    mockListDecisionsPoolQueries(pool, {
      campaign: { id: 'camp_1', tenant_id: 'tenant_1' },
      counts: { all_count: '2', accept_count: '1', refuse_count: '1' },
      timelineDecisions: [
        {
          recipient_email: 'jane@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:00:00.000Z',
          source: 'email_cta',
        },
        {
          recipient_email: 'john@example.com',
          decision: 'refuse',
          decided_at: '2026-04-22T11:00:00.000Z',
          source: 'email_cta',
        },
      ],
      paginatedDecisions: [
        {
          campaign_id: 'camp_1',
          recipient_email: 'jane@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:00:00.000Z',
          source: 'email_cta',
        },
        {
          campaign_id: 'camp_1',
          recipient_email: 'john@example.com',
          decision: 'refuse',
          decided_at: '2026-04-22T11:00:00.000Z',
          source: 'email_cta',
        },
      ],
    });
    const { service } = createRequestsService(pool);

    const result = await service.listDecisions('tenant_1', 'camp_1');

    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(result.campaign_id).toBe('camp_1');
    expect(result.tenant_id).toBe('tenant_1');
    expect(result.last_synced_at).toBe('2026-04-22T12:00:00.000Z');
    expect(result.counts).toEqual({ all: 2, accept: 1, refuse: 1 });
    expect(result.recipient_status_counts).toEqual({
      fulfilled: 0,
      accepted: 1,
      refused: 1,
      signed_up: 0,
      invite_sent: 0,
      on_platform: 0,
    });
    expect(result.recipients).toHaveLength(2);
    expect(result.pagination).toEqual({
      decision: 'all',
      limit: 20,
      offset: 0,
      returned: 2,
      has_more: false,
    });
    expect(result.pagination.has_more).toBe(false);
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions[0]).toMatchObject({
      recipient_email: 'jane@example.com',
      decision: 'accept',
    });
  });

  it('returns decision timeline response contract required by OpenAPI', async () => {
    const pool = { query: jest.fn() };
    mockListDecisionsPoolQueries(pool, {
      campaign: { id: 'camp_contract', tenant_id: 'tenant_contract' },
      counts: { all_count: '3', accept_count: '2', refuse_count: '1' },
      timelineDecisions: [
        {
          recipient_email: 'accept-1@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:05:00.000Z',
          source: 'email_cta',
        },
        {
          recipient_email: 'accept-2@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T11:00:00.000Z',
          source: 'email_cta',
        },
        {
          recipient_email: 'refuse-1@example.com',
          decision: 'refuse',
          decided_at: '2026-04-22T10:00:00.000Z',
          source: 'email_cta',
        },
      ],
      paginatedDecisions: [
        {
          campaign_id: 'camp_contract',
          recipient_email: 'accept-1@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:05:00.000Z',
          source: 'email_cta',
        },
      ],
    });
    const { service } = createRequestsService(pool);

    const result = await service.listDecisions('tenant_contract', 'camp_contract', {
      decision: 'accept',
      limit: 1,
      offset: 0,
    });

    expect(result).toEqual({
      campaign_id: 'camp_contract',
      tenant_id: 'tenant_contract',
      last_synced_at: '2026-04-22T12:05:00.000Z',
      counts: {
        all: 3,
        accept: 2,
        refuse: 1,
      },
      recipients: [
        {
          recipient_email: 'accept-1@example.com',
          onboarding_status: 'accepted',
          invite_status: null,
          decision: 'accept',
          decision_source: 'email_cta',
          decided_at: '2026-04-22T12:05:00.000Z',
          updated_at: '2026-04-22T12:05:00.000Z',
        },
        {
          recipient_email: 'accept-2@example.com',
          onboarding_status: 'accepted',
          invite_status: null,
          decision: 'accept',
          decision_source: 'email_cta',
          decided_at: '2026-04-22T11:00:00.000Z',
          updated_at: '2026-04-22T11:00:00.000Z',
        },
        {
          recipient_email: 'refuse-1@example.com',
          onboarding_status: 'refused',
          invite_status: null,
          decision: 'refuse',
          decision_source: 'email_cta',
          decided_at: '2026-04-22T10:00:00.000Z',
          updated_at: '2026-04-22T10:00:00.000Z',
        },
      ],
      recipient_status_counts: {
        fulfilled: 0,
        accepted: 2,
        refused: 1,
        signed_up: 0,
        invite_sent: 0,
        on_platform: 0,
      },
      pagination: {
        decision: 'accept',
        limit: 1,
        offset: 0,
        returned: 1,
        has_more: true,
      },
      decisions: [
        {
          campaign_id: 'camp_contract',
          recipient_email: 'accept-1@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:05:00.000Z',
          source: 'email_cta',
        },
      ],
    });
  });

  it('fails when campaign does not belong to tenant', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }),
    };
    const { service } = createRequestsService(pool);

    await expect(service.listDecisions('tenant_1', 'camp_missing')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('ensures inbox row after public email CTA accept is recorded', async () => {
    process.env.RESEND_DECISION_SECRET = 'test-decision-secret';
    const campaignRow = {
      id: 'camp_1',
      tenant_id: 'tenant_importer',
      title: 'Evidence request',
      description: '',
      request_type: 'GENERAL_EVIDENCE',
      status: 'RUNNING',
      target_organization_ids: [],
      target_farmer_ids: [],
      target_plot_ids: [],
      target_contact_emails: ['exporter@tracebud.test'],
      due_at: '2026-05-01T00:00:00.000Z',
      reminder_sent_at: null,
      accepted_count: 1,
      pending_count: 0,
      expired_count: 0,
      created_by: 'user_1',
      idempotency_key: null,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-22T12:00:00.000Z',
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ campaign_id: 'camp_1' }] })
        .mockResolvedValueOnce({ rows: [campaignRow] }),
    };
    const { service, inboxService } = createRequestsService(pool);
    const token = createHmac('sha256', 'test-decision-secret')
      .update('camp_1:exporter@tracebud.test')
      .digest('hex');

    const result = await service.recordDecisionIntentPublic({
      campaignId: 'camp_1',
      recipientEmail: 'exporter@tracebud.test',
      decision: 'accept',
      token,
    });

    expect(result.recorded).toBe(true);
    expect(inboxService.ensureInboxFromEmailCtaAccept).toHaveBeenCalledWith({
      campaignId: 'camp_1',
      recipientEmail: 'exporter@tracebud.test',
    });
    delete process.env.RESEND_DECISION_SECRET;
  });

  it('does not ensure inbox row when public email CTA refuse is recorded', async () => {
    process.env.RESEND_DECISION_SECRET = 'test-decision-secret';
    const campaignRow = {
      id: 'camp_1',
      tenant_id: 'tenant_importer',
      title: 'Evidence request',
      description: '',
      request_type: 'GENERAL_EVIDENCE',
      status: 'EXPIRED',
      target_organization_ids: [],
      target_farmer_ids: [],
      target_plot_ids: [],
      target_contact_emails: ['exporter@tracebud.test'],
      due_at: '2026-05-01T00:00:00.000Z',
      reminder_sent_at: null,
      accepted_count: 0,
      pending_count: 0,
      expired_count: 1,
      created_by: 'user_1',
      idempotency_key: null,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-22T12:00:00.000Z',
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ campaign_id: 'camp_1' }] })
        .mockResolvedValueOnce({ rows: [campaignRow] }),
    };
    const { service, inboxService } = createRequestsService(pool);
    const token = createHmac('sha256', 'test-decision-secret')
      .update('camp_1:exporter@tracebud.test')
      .digest('hex');

    await service.recordDecisionIntentPublic({
      campaignId: 'camp_1',
      recipientEmail: 'exporter@tracebud.test',
      decision: 'refuse',
      token,
    });

    expect(inboxService.ensureInboxFromEmailCtaAccept).not.toHaveBeenCalled();
    delete process.env.RESEND_DECISION_SECRET;
  });

  it('accepts decision tokens signed with RESEND_API_KEY when RESEND_DECISION_SECRET is unset', async () => {
    delete process.env.RESEND_DECISION_SECRET;
    process.env.RESEND_API_KEY = 're_test_api_key';
    const campaignRow = {
      id: 'camp_1',
      tenant_id: 'tenant_importer',
      title: 'Evidence request',
      description: '',
      request_type: 'GENERAL_EVIDENCE',
      status: 'RUNNING',
      target_organization_ids: [],
      target_farmer_ids: [],
      target_plot_ids: [],
      target_contact_emails: ['exporter@tracebud.test'],
      due_at: '2026-05-01T00:00:00.000Z',
      reminder_sent_at: null,
      accepted_count: 1,
      pending_count: 0,
      expired_count: 0,
      created_by: 'user_1',
      idempotency_key: null,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-22T12:00:00.000Z',
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ campaign_id: 'camp_1' }] })
        .mockResolvedValueOnce({ rows: [campaignRow] }),
    };
    const { service, inboxService } = createRequestsService(pool);
    const token = createHmac('sha256', 're_test_api_key')
      .update('camp_1:exporter@tracebud.test')
      .digest('hex');

    const result = await service.recordDecisionIntentPublic({
      campaignId: 'camp_1',
      recipientEmail: 'exporter@tracebud.test',
      decision: 'accept',
      token,
    });

    expect(result.recorded).toBe(true);
    expect(inboxService.ensureInboxFromEmailCtaAccept).toHaveBeenCalled();
    delete process.env.RESEND_API_KEY;
  });

  it('returns migration guidance when decision ledger table is missing', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'camp_1', tenant_id: 'tenant_1' }],
        })
        .mockResolvedValueOnce({
          rows: [{ all_count: '0', accept_count: '0', refuse_count: '0' }],
        })
        .mockRejectedValueOnce({
          code: '42P01',
          message: 'relation "request_campaign_recipient_decisions" does not exist',
        }),
    };
    const { service } = createRequestsService(pool);

    await expect(service.listDecisions('tenant_1', 'camp_1')).rejects.toThrow(
      'Request campaign decision ledger is not available. Apply TB-V16-027 migration first.',
    );
  });

  it('returns public preview for sent campaigns', async () => {
    const pool = {
      query: jest.fn(async (sql: string) => {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        if (normalized.includes('FROM request_campaigns') && normalized.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: 'camp_1',
                tenant_id: 'tenant_coop',
                title: 'Upload land papers',
                description: '',
                request_type: 'GENERAL_EVIDENCE',
                status: 'RUNNING',
                target_organization_ids: [],
                target_farmer_ids: [],
                target_plot_ids: [],
                target_contact_emails: ['farmer@example.com'],
                due_at: '2026-07-01T00:00:00.000Z',
                reminder_sent_at: null,
                accepted_count: 0,
                pending_count: 1,
                expired_count: 0,
                created_by: 'user_1',
                idempotency_key: null,
                created_at: '2026-06-01T00:00:00.000Z',
                updated_at: '2026-06-01T00:00:00.000Z',
              },
            ],
          };
        }
        if (normalized.includes('FROM admin_organizations')) {
          return { rows: [{ name: 'Rwanda Cooperative' }] };
        }
        return { rows: [] };
      }),
    };
    const { service } = createRequestsService(pool);

    await expect(service.getCampaignPublicPreview('camp_1')).resolves.toEqual({
      campaignId: 'camp_1',
      title: 'Upload land papers',
      fromOrg: 'Rwanda Cooperative',
      dueAt: '2026-07-01T00:00:00.000Z',
      senderTenantId: 'tenant_coop',
    });
  });
});
