import { ForbiddenException } from '@nestjs/common';
import { AuditWriteService } from './audit-write.service';

describe('AuditWriteService idempotency', () => {
  it('returns existing row when clientEventId already exists', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'existing', timestamp: '2026-06-23T12:00:00.000Z' }],
        }),
    };
    const service = new AuditWriteService(pool as any);

    await expect(
      service.appendEvent({
        dto: {
          eventType: 'plot_compliance_declared',
          clientEventId: 'pending-sync-42',
          payload: {
            farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
            plotId: 'plot-1',
          },
        },
        user: {
          id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455',
          email: 'hector@example.com',
        },
      }),
    ).resolves.toEqual({
      ok: true,
      idempotent: true,
      id: 'existing',
      timestamp: '2026-06-23T12:00:00.000Z',
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toContain("payload ->> 'clientEventId'");
  });

  it('rejects dashboard users without tenant claim', async () => {
    const pool = { query: jest.fn(async () => ({ rows: [] })) };
    const service = new AuditWriteService(pool as any);

    await expect(
      service.appendEvent({
        dto: { eventType: 'test_event', payload: { ok: true } },
        user: {
          id: 'user_1',
          email: 'ops@example.com',
          app_metadata: { role: 'exporter' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
