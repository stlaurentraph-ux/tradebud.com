import { createHmac } from 'crypto';
import { BillingAdoptionPromoService } from './billing-adoption-promo.service';
import { BillingSubscriptionResolverService } from './billing-subscription-resolver.service';
import { BillingService } from './billing.service';
import { StripeBillingService } from './stripe-billing.service';
import { createBillingAdoptionPromoServiceMock } from '../testing/billing-service.mock';

const WEBHOOK_SECRET = 'whsec_replay_test_secret';

function signStripePayload(
  payload: string,
  secret = WEBHOOK_SECRET,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');
  return {
    payload,
    header: `t=${timestamp},v1=${signature}`,
  };
}

function buildStripeEvent(input: {
  eventId: string;
  eventType: string;
  stripeInvoiceId: string;
  paidAtSeconds?: number;
}) {
  return {
    id: input.eventId,
    type: input.eventType,
    data: {
      object: {
        id: input.stripeInvoiceId,
        ...(input.paidAtSeconds != null
          ? { status_transitions: { paid_at: input.paidAtSeconds } }
          : {}),
      },
    },
  };
}

function createSubscriptionResolverMock() {
  return {
    resolveMonthlySubscriptionEur: jest.fn().mockResolvedValue({ amount_eur: 0 }),
    listBillableTenantIdsForPeriod: jest.fn().mockResolvedValue([]),
    getStripeCustomerId: jest.fn().mockResolvedValue(null),
  };
}

function createStripeBillingMock() {
  return {
    isEnabled: jest.fn().mockReturnValue(false),
    createAndFinalizeInvoice: jest.fn(),
  };
}

function makeBillingService(pool: unknown): BillingService {
  return new BillingService(
    pool as any,
    createBillingAdoptionPromoServiceMock() as unknown as BillingAdoptionPromoService,
    createSubscriptionResolverMock() as unknown as BillingSubscriptionResolverService,
    createStripeBillingMock() as unknown as StripeBillingService,
  );
}

function paidInvoiceRow(stripeInvoiceId: string) {
  return {
    id: 'inv_paid_1',
    tenant_id: 'tenant_exporter',
    billing_period: '2026-06',
    subscription_amount_eur: 20,
    origin_seal_count: 1,
    origin_seal_amount_eur: 1,
    destination_submit_count: 0,
    destination_submit_amount_eur: 0,
    marketplace_fee_amount_eur: 0,
    total_amount_eur: 21,
    currency: 'EUR',
    invoice_status: 'PAID',
    stripe_invoice_id: stripeInvoiceId,
    finalized_at: new Date().toISOString(),
    paid_at: new Date().toISOString(),
  };
}

describe('Billing Stripe webhook replay', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterEach(() => {
    if (originalSecret) process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('replays signed invoice.paid webhook idempotently', async () => {
    const stripeInvoiceId = 'in_replay_paid_001';
    const event = buildStripeEvent({
      eventId: 'evt_replay_paid_001',
      eventType: 'invoice.paid',
      stripeInvoiceId,
      paidAtSeconds: 1_718_000_000,
    });
    const payload = JSON.stringify(event);
    const signed = signStripePayload(payload);

    const stripeBilling = new StripeBillingService();
    const verified = stripeBilling.constructWebhookEvent(signed.payload, signed.header);
    expect(verified.type).toBe('invoice.paid');

    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [paidInvoiceRow(stripeInvoiceId)],
      }),
    };
    const billingService = makeBillingService(pool);

    const first = await billingService.handleStripeWebhookEvent(verified);
    const second = await billingService.handleStripeWebhookEvent(verified);

    expect(first).toEqual({
      handled: true,
      invoiceId: 'inv_paid_1',
      eventType: 'invoice.paid',
    });
    expect(second).toEqual({
      handled: true,
      invoiceId: 'inv_paid_1',
      eventType: 'invoice.paid',
    });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('replays signed invoice.payment_failed webhook idempotently', async () => {
    const stripeInvoiceId = 'in_replay_failed_001';
    const event = buildStripeEvent({
      eventId: 'evt_replay_failed_001',
      eventType: 'invoice.payment_failed',
      stripeInvoiceId,
    });
    const payload = JSON.stringify(event);
    const signed = signStripePayload(payload);

    const stripeBilling = new StripeBillingService();
    const verified = stripeBilling.constructWebhookEvent(signed.payload, signed.header);

    const failedRow = {
      ...paidInvoiceRow(stripeInvoiceId),
      id: 'inv_failed_1',
      invoice_status: 'FAILED',
      paid_at: null,
    };

    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [failedRow],
      }),
    };
    const billingService = makeBillingService(pool);

    const first = await billingService.handleStripeWebhookEvent(verified);
    const second = await billingService.handleStripeWebhookEvent(verified);

    expect(first.handled).toBe(true);
    expect(first.eventType).toBe('invoice.payment_failed');
    expect(second.handled).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('does not downgrade a paid invoice on payment_failed replay', async () => {
    const stripeInvoiceId = 'in_replay_failed_001';
    const event = buildStripeEvent({
      eventId: 'evt_replay_failed_001',
      eventType: 'invoice.payment_failed',
      stripeInvoiceId,
    });

    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 0,
        rows: [],
      }),
    };
    const billingService = makeBillingService(pool);

    const result = await billingService.handleStripeWebhookEvent(event);

    expect(result).toEqual({
      handled: false,
      eventType: 'invoice.payment_failed',
    });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('returns handled=false for unsupported Stripe event types', async () => {
    const billingService = makeBillingService({ query: jest.fn() });

    const result = await billingService.handleStripeWebhookEvent({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_123' } },
    });

    expect(result).toEqual({
      handled: false,
      eventType: 'customer.subscription.updated',
    });
  });
});
