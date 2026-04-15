import { ForbiddenException } from '@nestjs/common';
import { AuditController } from './audit.controller';

describe('AuditController tenant-claim and role checks', () => {
  it('rejects create when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.create(
        { eventType: 'test_event', payload: { ok: true } } as any,
        { user: { id: 'user_1', email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects list when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(controller.list(undefined, { user: { id: 'user_1', email: 'farmer@example.com' } })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows list when tenant claim is present', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'evt_1' }] }) };
    const controller = new AuditController(pool as any);

    await expect(
      controller.list(undefined, { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } }),
    ).resolves.toEqual([{ id: 'evt_1' }]);
  });

  it('rejects gated-entry list when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(controller.listGatedEntry({ user: { id: 'user_1', email: 'farmer@example.com' } })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lists only dashboard gated-entry events for tenant claim', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'evt_gate_1' }] }) };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntry({
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([{ id: 'evt_gate_1' }]);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("event_type = 'dashboard_gated_entry_attempt'"),
      ['tenant_1'],
    );
  });
});
