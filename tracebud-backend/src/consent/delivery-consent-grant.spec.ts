import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import {
  ensureActiveConsentForDirectedDelivery,
  farmerHasActiveDeliveryConsent,
} from './delivery-consent-grant';

function makePool(rows: unknown[] = []): Pool {
  return {
    query: jest.fn().mockResolvedValue({ rows, rowCount: rows.length }),
  } as unknown as Pool;
}

describe('delivery-consent-grant', () => {
  it('no-ops when active grant already exists', async () => {
    const pool = makePool([{ id: 'g1', status: 'active', purpose_code: 'COMPLIANCE_COLLECTION' }]);
    await expect(
      ensureActiveConsentForDirectedDelivery(pool, {
        farmerId: 'farmer-1',
        granteeTenantId: 'tenant_1',
      }),
    ).resolves.toBeUndefined();
    expect((pool.query as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('activates pending grant for directed delivery', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'g-pending', status: 'pending', purpose_code: 'COMPLIANCE_COLLECTION' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [{ id: 'g-pending' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    await ensureActiveConsentForDirectedDelivery(pool, {
      farmerId: 'farmer-1',
      granteeTenantId: 'tenant_1',
      actorUserId: 'user-1',
    });

    expect((pool.query as jest.Mock).mock.calls[1][0]).toContain("status = 'active'");
  });

  it('creates active SHIPMENT_PREPARATION grant when none exists', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'g-new' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    await ensureActiveConsentForDirectedDelivery(pool, {
      farmerId: 'farmer-1',
      granteeTenantId: 'tenant_1',
    });

    expect((pool.query as jest.Mock).mock.calls[1][0]).toContain('SHIPMENT_PREPARATION');
  });

  it('rejects revoked relationship', async () => {
    const pool = makePool([{ id: 'g1', status: 'revoked', purpose_code: 'COMPLIANCE_COLLECTION' }]);
    await expect(
      ensureActiveConsentForDirectedDelivery(pool, {
        farmerId: 'farmer-1',
        granteeTenantId: 'tenant_1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports active delivery consent', async () => {
    const pool = makePool([{ '?column?': 1 }]);
    await expect(farmerHasActiveDeliveryConsent(pool, 'farmer-1', 'tenant_1')).resolves.toBe(true);
  });
});
