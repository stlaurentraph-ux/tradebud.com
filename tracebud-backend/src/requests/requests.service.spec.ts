import { BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  it('lists recipient decisions for a tenant-scoped campaign in descending order', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'camp_1', tenant_id: 'tenant_1' }],
        })
        .mockResolvedValueOnce({
          rows: [{ all_count: '2', accept_count: '1', refuse_count: '1' }],
        })
        .mockResolvedValueOnce({
          rows: [
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
        }),
    };
    const service = new RequestsService(pool as any);

    const result = await service.listDecisions('tenant_1', 'camp_1');

    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(result.campaign_id).toBe('camp_1');
    expect(result.tenant_id).toBe('tenant_1');
    expect(result.last_synced_at).toBe('2026-04-22T12:00:00.000Z');
    expect(result.counts).toEqual({ all: 2, accept: 1, refuse: 1 });
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
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'camp_contract', tenant_id: 'tenant_contract' }],
        })
        .mockResolvedValueOnce({
          rows: [{ all_count: '3', accept_count: '2', refuse_count: '1' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              campaign_id: 'camp_contract',
              recipient_email: 'accept-1@example.com',
              decision: 'accept',
              decided_at: '2026-04-22T12:05:00.000Z',
              source: 'email_cta',
            },
          ],
        }),
    };
    const service = new RequestsService(pool as any);

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
    const service = new RequestsService(pool as any);

    await expect(service.listDecisions('tenant_1', 'camp_missing')).rejects.toBeInstanceOf(
      BadRequestException,
    );
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
    const service = new RequestsService(pool as any);

    await expect(service.listDecisions('tenant_1', 'camp_1')).rejects.toThrow(
      'Request campaign decision ledger is not available. Apply TB-V16-027 migration first.',
    );
  });
});
