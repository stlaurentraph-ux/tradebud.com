import { BillingSubscriptionResolverService } from './billing-subscription-resolver.service';

describe('BillingSubscriptionResolverService', () => {
  it('resolves MVP default Compliance Starter subscription for a tenant', async () => {
    const subscriptionRow = {
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
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ team_size: '11-50' }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [subscriptionRow] }),
    };

    const service = new BillingSubscriptionResolverService(pool as any);
    const breakdown = await service.resolveMonthlySubscriptionEur('tenant_1');

    expect(breakdown.amount_eur).toBe(19);
    expect(breakdown.pricing_source).toBe('bundle');
  });
});
