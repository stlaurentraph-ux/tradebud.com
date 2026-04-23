import { ForbiddenException } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

describe('RequestsController', () => {
  const makeReq = (role: string, tenantId = 'tenant_1') => ({
    user: {
      id: 'user_1',
      app_metadata: { role, tenant_id: tenantId },
    },
  });

  it('denies decision timeline for roles outside requests access policy', async () => {
    const service = { listDecisions: jest.fn() } as unknown as RequestsService;
    const controller = new RequestsController(service);

    await expect(controller.listDecisions(makeReq('farmer'), 'camp_1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies decision timeline when tenant claim is missing', async () => {
    const service = { listDecisions: jest.fn() } as unknown as RequestsService;
    const controller = new RequestsController(service);

    await expect(
      controller.listDecisions({
        user: {
          id: 'user_1',
          app_metadata: { role: 'admin' },
        },
      } as any,
      'camp_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forwards decision query params with numeric parsing to service', async () => {
    const service = {
      listDecisions: jest.fn().mockResolvedValue({
        campaign_id: 'camp_1',
        tenant_id: 'tenant_abc',
        last_synced_at: '2026-04-22T12:00:00.000Z',
        counts: { all: 3, accept: 2, refuse: 1 },
        pagination: {
          decision: 'accept',
          limit: 10,
          offset: 20,
          returned: 1,
          has_more: true,
        },
        decisions: [
          {
            campaign_id: 'camp_1',
            recipient_email: 'accept-1@example.com',
            decision: 'accept',
            decided_at: '2026-04-22T12:00:00.000Z',
            source: 'email_cta',
          },
        ],
      }),
    } as unknown as RequestsService;
    const controller = new RequestsController(service);

    const result = await controller.listDecisions(makeReq('admin', 'tenant_abc'), 'camp_1', 'accept', '10', '20');

    expect(service.listDecisions).toHaveBeenCalledWith('tenant_abc', 'camp_1', {
      decision: 'accept',
      limit: 10,
      offset: 20,
    });
    expect(result).toEqual({
      campaign_id: 'camp_1',
      tenant_id: 'tenant_abc',
      last_synced_at: '2026-04-22T12:00:00.000Z',
      counts: { all: 3, accept: 2, refuse: 1 },
      pagination: {
        decision: 'accept',
        limit: 10,
        offset: 20,
        returned: 1,
        has_more: true,
      },
      decisions: [
        {
          campaign_id: 'camp_1',
          recipient_email: 'accept-1@example.com',
          decision: 'accept',
          decided_at: '2026-04-22T12:00:00.000Z',
          source: 'email_cta',
        },
      ],
    });
  });

  it('passes undefined pagination fields when query values are invalid', async () => {
    const service = {
      listDecisions: jest.fn().mockResolvedValue({
        campaign_id: 'camp_1',
        tenant_id: 'tenant_abc',
        last_synced_at: null,
        counts: { all: 0, accept: 0, refuse: 0 },
        pagination: {
          decision: 'all',
          limit: 20,
          offset: 0,
          returned: 0,
          has_more: false,
        },
        decisions: [],
      }),
    } as unknown as RequestsService;
    const controller = new RequestsController(service);

    await controller.listDecisions(makeReq('exporter', 'tenant_abc'), 'camp_1', 'all', 'NaN', 'abc');

    expect(service.listDecisions).toHaveBeenCalledWith('tenant_abc', 'camp_1', {
      decision: 'all',
      limit: undefined,
      offset: undefined,
    });
  });
});
