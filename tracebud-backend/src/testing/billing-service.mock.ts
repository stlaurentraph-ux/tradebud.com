import type { BillingService } from '../billing/billing.service';

export function createBillingServiceMock(): BillingService {
  return {
    recordOriginSealMeter: jest.fn().mockResolvedValue({}),
    recordDestinationSubmitMeter: jest.fn().mockResolvedValue({}),
    assertBillingGateClear: jest.fn().mockResolvedValue(undefined),
    getAdoptionPromoStatus: jest.fn().mockResolvedValue(null),
  } as unknown as BillingService;
}

export function createBillingAdoptionPromoServiceMock() {
  return {
    ensureAdoptionPromo: jest.fn().mockResolvedValue(null),
    getAdoptionPromoStatus: jest.fn().mockResolvedValue(null),
    isSubscriptionFree: jest.fn().mockResolvedValue(false),
    resolveUsagePromoInTransaction: jest.fn().mockResolvedValue({
      amount_eur: 1,
      payment_method: 'CARD',
      meter_status: 'METERED',
      promo_applied: false,
      promo_code: null,
    }),
  };
}
