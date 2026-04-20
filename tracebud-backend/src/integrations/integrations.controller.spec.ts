import { ForbiddenException } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';

describe('IntegrationsController', () => {
  it('rejects webhook registration when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new IntegrationsController(pool as any);
    await expect(
      controller.registerWebhook(
        {
          endpoint_url: 'https://hooks.example.com/webhook',
          event_types: ['dds_package_submission_accepted'],
          secret_rotation_policy: 'quarterly',
        },
        { user: { id: 'user_1', email: 'exporter+ops@tracebud.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects webhook registration for non-exporter roles', async () => {
    const pool = { query: jest.fn() };
    const controller = new IntegrationsController(pool as any);
    await expect(
      controller.registerWebhook(
        {
          endpoint_url: 'https://hooks.example.com/webhook',
          event_types: ['dds_package_submission_accepted'],
          secret_rotation_policy: 'quarterly',
        },
        {
          user: {
            id: 'user_1',
            email: 'agent+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow('Only exporters can manage integration webhooks');
  });

  it('registers webhook and appends registration + delivery telemetry evidence', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new IntegrationsController(pool as any);
    const result = await controller.registerWebhook(
      {
        endpoint_url: 'https://hooks.example.com/webhook',
        event_types: ['dds_package_submission_accepted'],
        secret_rotation_policy: 'quarterly',
      },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );
    expect(result).toEqual({
      id: expect.any(String),
      status: 'registered',
    });
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'integration_webhook_registered']),
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining(['integration_delivery_attempt_queued', 'integration_delivery_succeeded']),
    );
  });

  it('lists tenant-scoped webhooks for exporter/agent roles', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_1', event_type: 'integration_webhook_registered' }],
        }),
    };
    const controller = new IntegrationsController(pool as any);
    await expect(
      controller.listWebhooks('10', '0', {
        user: {
          id: 'user_1',
          email: 'agent+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_1', event_type: 'integration_webhook_registered' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('lists tenant-scoped webhook deliveries', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_2', event_type: 'integration_delivery_succeeded' }],
        }),
    };
    const controller = new IntegrationsController(pool as any);
    await expect(
      controller.listWebhookDeliveries('webhook_1', '10', '0', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_2', event_type: 'integration_delivery_succeeded' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });
});

