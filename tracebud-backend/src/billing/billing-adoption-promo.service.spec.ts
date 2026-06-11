import {
  BillingAdoptionPromoService,
  endOfUtcCalendarMonth,
  startOfNextUtcCalendarMonth,
} from './billing-adoption-promo.service';

describe('BillingAdoptionPromoService', () => {
  it('waives the first origin seal once per tenant', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [
            {
              tenant_id: 'tenant_1',
              adoption_started_at: new Date().toISOString(),
              subscription_free_until: new Date(Date.now() + 86_400_000).toISOString(),
              subscription_promo_forfeited_at: null,
              first_origin_seal_waived_at: null,
              first_destination_submit_waived_at: null,
            },
          ],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
    };

    const pool = { query: jest.fn() };
    const service = new BillingAdoptionPromoService(pool as any);

    const first = await service.resolveUsagePromoInTransaction(
      client as any,
      'tenant_1',
      'origin_seal',
      1,
    );
    expect(first.promo_applied).toBe(true);
    expect(first.amount_eur).toBe(0);
    expect(first.promo_code).toBe('ADOPTION_FIRST_ORIGIN_SEAL');
    expect(client.query).toHaveBeenCalledTimes(4);
  });

  it('forfeits subscription promo at end of waiver month when first free leg is used', () => {
    const september = new Date('2026-09-15T12:00:00.000Z');
    const endOfSeptember = endOfUtcCalendarMonth(september);
    const octoberStart = startOfNextUtcCalendarMonth(endOfSeptember);

    expect(endOfSeptember.getUTCMonth()).toBe(8);
    expect(octoberStart.getUTCMonth()).toBe(9);
    expect(octoberStart.getUTCDate()).toBe(1);
  });
});
