import {
  inferBillingBandFromTeamSize,
  resolveBillingBandZone,
  resolveRequiredBillingBandFromContactCount,
  resolveSubscriptionPriceEur,
} from './billing-subscription-pricing';

describe('billing-subscription-pricing', () => {
  it('resolves Compliance Starter bundle at Growth band', () => {
    const price = resolveSubscriptionPriceEur({
      billingBand: 'growth',
      subscriptionBundle: 'compliance_starter',
      enabledModules: ['foundation', 'eudr'],
    });
    expect(price.amount_eur).toBe(49);
    expect(price.pricing_source).toBe('bundle');
  });

  it('sums standalone modules when no bundle is set', () => {
    const price = resolveSubscriptionPriceEur({
      billingBand: 'starter',
      subscriptionBundle: null,
      enabledModules: ['foundation', 'eudr'],
    });
    expect(price.amount_eur).toBe(30);
    expect(price.pricing_source).toBe('modules');
  });

  it('maps team size strings to billing bands', () => {
    expect(inferBillingBandFromTeamSize('11-50')).toBe('starter');
    expect(inferBillingBandFromTeamSize('51-500')).toBe('growth');
    expect(inferBillingBandFromTeamSize('501-3000')).toBe('scale');
  });

  it('maps managed contact counts to required billing bands', () => {
    expect(resolveRequiredBillingBandFromContactCount(12)).toBe('starter');
    expect(resolveRequiredBillingBandFromContactCount(50)).toBe('starter');
    expect(resolveRequiredBillingBandFromContactCount(51)).toBe('growth');
    expect(resolveRequiredBillingBandFromContactCount(3000)).toBe('scale');
    expect(resolveRequiredBillingBandFromContactCount(3001)).toBe('enterprise');
  });

  it('resolves band utilization zones', () => {
    expect(
      resolveBillingBandZone({
        managedContactCount: 30,
        contractedBand: 'starter',
        requiredBand: 'starter',
      }),
    ).toBe('green');
    expect(
      resolveBillingBandZone({
        managedContactCount: 42,
        contractedBand: 'starter',
        requiredBand: 'starter',
      }),
    ).toBe('amber');
    expect(
      resolveBillingBandZone({
        managedContactCount: 80,
        contractedBand: 'starter',
        requiredBand: 'growth',
      }),
    ).toBe('red');
  });
});
