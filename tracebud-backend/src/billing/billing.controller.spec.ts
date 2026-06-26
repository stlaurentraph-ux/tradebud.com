import { ForbiddenException } from '@nestjs/common';
import { BillingController } from './billing.controller';
import type { BillingService } from './billing.service';
import type { BillingSubscriptionBandService } from './billing-subscription-band.service';

function makeController(finalizeMonthlyInvoice = jest.fn().mockResolvedValue({ id: 'inv_1' })) {
  const billingService = { finalizeMonthlyInvoice } as unknown as BillingService;
  const subscriptionBandService = {} as unknown as BillingSubscriptionBandService;
  return {
    controller: new BillingController(billingService, subscriptionBandService),
    finalizeMonthlyInvoice,
  };
}

function adminReq(tenantId: string) {
  return {
    user: {
      id: 'admin_user',
      email: 'admin@tracebud.com',
      app_metadata: { tenant_id: tenantId, role: 'admin' },
    },
  };
}

describe('BillingController.finalizeInvoice tenant binding', () => {
  it('rejects a non-admin caller', async () => {
    const { controller, finalizeMonthlyInvoice } = makeController();

    await expect(
      controller.finalizeInvoice({ billingPeriod: '2026-06' }, {
        user: { id: 'u1', email: 'exporter@tracebud.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } },
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(finalizeMonthlyInvoice).not.toHaveBeenCalled();
  });

  it('rejects an admin finalizing another tenant via body.tenantId', async () => {
    const { controller, finalizeMonthlyInvoice } = makeController();

    await expect(
      controller.finalizeInvoice({ billingPeriod: '2026-06', tenantId: 'tenant_2' }, adminReq('tenant_1')),
    ).rejects.toThrow(ForbiddenException);
    expect(finalizeMonthlyInvoice).not.toHaveBeenCalled();
  });

  it('finalizes for the caller tenant when body.tenantId matches', async () => {
    const { controller, finalizeMonthlyInvoice } = makeController();

    await expect(
      controller.finalizeInvoice(
        { billingPeriod: '2026-06', tenantId: 'tenant_1', subscriptionAmountEur: 50 },
        adminReq('tenant_1'),
      ),
    ).resolves.toEqual({ invoice: { id: 'inv_1' } });
    expect(finalizeMonthlyInvoice).toHaveBeenCalledWith('tenant_1', '2026-06', 50);
  });

  it('defaults to the caller tenant when body.tenantId is omitted', async () => {
    const { controller, finalizeMonthlyInvoice } = makeController();

    await controller.finalizeInvoice({ billingPeriod: '2026-06' }, adminReq('tenant_1'));
    expect(finalizeMonthlyInvoice).toHaveBeenCalledWith('tenant_1', '2026-06', 0);
  });
});
