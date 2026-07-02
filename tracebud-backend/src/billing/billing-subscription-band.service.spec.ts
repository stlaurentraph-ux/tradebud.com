import { BillingSubscriptionBandService } from './billing-subscription-band.service';

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    tenant_id: 'tenant_1',
    billing_band: 'starter',
    subscription_bundle: 'compliance_starter',
    enabled_modules: ['foundation', 'eudr'],
    subscription_billing_enabled: true,
    stripe_customer_id: null,
    pending_billing_band: null,
    band_upgrade_accepted_at: null,
    band_effective_from: null,
    enterprise_contract_active: false,
    ...overrides,
  };
}

describe('BillingSubscriptionBandService', () => {
  const pool = { query: jest.fn().mockResolvedValue(undefined) };

  it('returns amber zone when approaching Starter ceiling', async () => {
    const managedContactsService = {
      countManagedContacts: jest.fn().mockResolvedValue(42),
    };
    const subscriptionResolver = {
      applyScheduledBandUpgrades: jest.fn().mockResolvedValue(undefined),
      getSubscriptionRow: jest.fn().mockResolvedValue(createRow()),
      resolveContactLimitBand: jest.fn().mockReturnValue('starter'),
      resolveMonthlySubscriptionEur: jest.fn().mockResolvedValue({
        billing_band: 'starter',
        subscription_bundle: 'compliance_starter',
        enabled_modules: ['foundation', 'eudr'],
        amount_eur: 19,
        pricing_source: 'bundle',
      }),
    };

    const service = new BillingSubscriptionBandService(
      pool as any,
      managedContactsService as any,
      subscriptionResolver as any,
    );

    const status = await service.getSubscriptionBandStatus('tenant_1');

    expect(status.zone).toBe('amber');
    expect(status.contacts_add_blocked).toBe(false);
    expect(status.preview_band).toBe('growth');
  });

  it('blocks contact adds when count exceeds contracted band', async () => {
    const managedContactsService = {
      countManagedContacts: jest.fn().mockResolvedValue(120),
    };
    const subscriptionResolver = {
      applyScheduledBandUpgrades: jest.fn().mockResolvedValue(undefined),
      getSubscriptionRow: jest.fn().mockResolvedValue(createRow()),
      resolveContactLimitBand: jest.fn().mockReturnValue('starter'),
      resolveMonthlySubscriptionEur: jest.fn().mockResolvedValue({
        billing_band: 'starter',
        subscription_bundle: 'compliance_starter',
        enabled_modules: ['foundation', 'eudr'],
        amount_eur: 19,
        pricing_source: 'bundle',
      }),
    };

    const service = new BillingSubscriptionBandService(
      pool as any,
      managedContactsService as any,
      subscriptionResolver as any,
    );

    const status = await service.getSubscriptionBandStatus('tenant_1');

    expect(status.zone).toBe('red');
    expect(status.contacts_add_blocked).toBe(true);
    expect(status.upgrade_consent_available).toBe(true);
    expect(status.target_upgrade_band).toBe('growth');
  });

  it('allows adds after pending upgrade expands contact limit band', async () => {
    const managedContactsService = {
      countManagedContacts: jest.fn().mockResolvedValue(120),
    };
    const subscriptionResolver = {
      applyScheduledBandUpgrades: jest.fn().mockResolvedValue(undefined),
      getSubscriptionRow: jest.fn().mockResolvedValue(
        createRow({
          pending_billing_band: 'growth',
          band_upgrade_accepted_at: new Date().toISOString(),
          band_effective_from: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      ),
      resolveContactLimitBand: jest.fn().mockReturnValue('growth'),
      resolveMonthlySubscriptionEur: jest.fn().mockResolvedValue({
        billing_band: 'starter',
        subscription_bundle: 'compliance_starter',
        enabled_modules: ['foundation', 'eudr'],
        amount_eur: 19,
        pricing_source: 'bundle',
      }),
    };

    const service = new BillingSubscriptionBandService(
      pool as any,
      managedContactsService as any,
      subscriptionResolver as any,
    );

    const assessment = await service.assessContactCapacity('tenant_1', 1);
    expect(assessment.allowed).toBe(true);
  });
});
