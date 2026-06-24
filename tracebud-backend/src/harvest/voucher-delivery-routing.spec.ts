import { BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import {
  farmerCanDeliverToTenant,
  resolveTenantIdForBuyerEmail,
  resolveVoucherDeliveryRecipient,
} from './voucher-delivery-routing';

function makePool(rows: unknown[] = []): Pool {
  return {
    query: jest.fn().mockResolvedValue({ rows, rowCount: rows.length }),
  } as unknown as Pool;
}

describe('voucher-delivery-routing', () => {
  it('returns empty recipient when no delivery target provided', async () => {
    const pool = makePool();
    await expect(
      resolveVoucherDeliveryRecipient(pool, { farmerId: 'farmer-1' }),
    ).resolves.toEqual({
      intendedRecipientTenantId: null,
      intendedRecipientEmail: null,
    });
  });

  it('resolves buyer email to tenant and ensures consent', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ email: 'buyer@coop.example', tenant_id: 'tenant_exporter' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'grant-1', status: 'active', purpose_code: 'COMPLIANCE_COLLECTION' }],
          rowCount: 1,
        }),
    } as unknown as Pool;

    await expect(
      resolveVoucherDeliveryRecipient(pool, {
        farmerId: 'farmer-1',
        deliverToEmail: 'buyer@coop.example',
      }),
    ).resolves.toEqual({
      intendedRecipientTenantId: 'tenant_exporter',
      intendedRecipientEmail: 'buyer@coop.example',
    });
  });

  it('auto-grants consent when delivering to tenant without prior grant', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'grant-new' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    await expect(
      resolveVoucherDeliveryRecipient(pool, {
        farmerId: 'farmer-1',
        deliverToTenantId: 'tenant_exporter',
      }),
    ).resolves.toEqual({
      intendedRecipientTenantId: 'tenant_exporter',
      intendedRecipientEmail: null,
    });
  });

  it('returns pending invite when buyer email is not on Tracebud yet', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    } as unknown as Pool;

    await expect(
      resolveVoucherDeliveryRecipient(pool, {
        farmerId: 'farmer-1',
        deliverToEmail: 'newbuyer@example.com',
      }),
    ).resolves.toEqual({
      intendedRecipientTenantId: null,
      intendedRecipientEmail: 'newbuyer@example.com',
      pendingBuyerInvite: true,
    });
  });

  it('rejects delivery when consent was revoked', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ id: 'grant-1', status: 'revoked', purpose_code: 'COMPLIANCE_COLLECTION' }],
        rowCount: 1,
      }),
    } as unknown as Pool;

    await expect(
      resolveVoucherDeliveryRecipient(pool, {
        farmerId: 'farmer-1',
        deliverToTenantId: 'tenant_exporter',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolves tenant from signup contact email', async () => {
    const pool = makePool([{ email: 'ops@example.com', tenant_id: 'tenant_1' }]);
    await expect(resolveTenantIdForBuyerEmail(pool, 'Ops@Example.com')).resolves.toBe('tenant_1');
  });

  it('checks active consent grant for farmer and tenant', async () => {
    const pool = makePool([{ '?column?': 1 }]);
    await expect(farmerCanDeliverToTenant(pool, 'farmer-1', 'tenant_1')).resolves.toBe(true);
  });
});
