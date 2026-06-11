import { ForbiddenException } from '@nestjs/common';
import { BillingAdoptionPromoService } from './billing-adoption-promo.service';
import { BillingSubscriptionResolverService } from './billing-subscription-resolver.service';
import { BillingService } from './billing.service';
import { StripeBillingService } from './stripe-billing.service';
import { createBillingAdoptionPromoServiceMock } from '../testing/billing-service.mock';

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
import {
  BILLING_DESTINATION_SUBMIT_FEE_EUR,
  BILLING_EVENT_DESTINATION_SUBMIT,
  BILLING_EVENT_ORIGIN_SEAL,
  BILLING_ORIGIN_SEAL_FEE_EUR,
} from './billing.constants';

describe('BillingService', () => {
  it('records origin seal meter idempotently', async () => {
    const meterRow = {
      id: 'meter_1',
      tenant_id: 'tenant_exporter',
      event_type: BILLING_EVENT_ORIGIN_SEAL,
      amount_eur: BILLING_ORIGIN_SEAL_FEE_EUR,
      currency: 'EUR',
      idempotency_key: 'shp_1:origin_seal',
      reference_type: 'shipment_header',
      reference_id: 'shp_1',
      shipment_header_id: 'shp_1',
      dds_record_id: null,
      sponsor_tenant_id: null,
      payment_method: 'CARD',
      meter_status: 'METERED',
      billing_period: '2026-06',
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [meterRow] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: jest.fn(),
    };

    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [meterRow] }),
      connect: jest.fn().mockResolvedValue(client),
    };

    const service = makeBillingService(pool);
    const first = await service.recordOriginSealMeter('tenant_exporter', 'shp_1');
    const second = await service.recordOriginSealMeter('tenant_exporter', 'shp_1');

    expect(first.amount_eur).toBe(1);
    expect(first.event_type).toBe(BILLING_EVENT_ORIGIN_SEAL);
    expect(second.replayed).toBe(true);
  });

  it('records destination submit meter at €1', async () => {
    const meterRow = {
      id: 'meter_2',
      tenant_id: 'tenant_importer',
      event_type: BILLING_EVENT_DESTINATION_SUBMIT,
      amount_eur: BILLING_DESTINATION_SUBMIT_FEE_EUR,
      currency: 'EUR',
      idempotency_key: 'shp_1:destination_submit',
      reference_type: 'dds_record',
      reference_id: 'dds_1',
      shipment_header_id: 'shp_1',
      dds_record_id: 'dds_1',
      sponsor_tenant_id: null,
      payment_method: 'CARD',
      meter_status: 'METERED',
      billing_period: '2026-06',
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [meterRow] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: jest.fn(),
    };

    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }),
      connect: jest.fn().mockResolvedValue(client),
    };

    const service = makeBillingService(pool);
    const meter = await service.recordDestinationSubmitMeter('tenant_importer', 'shp_1', 'dds_1');

    expect(meter.amount_eur).toBe(1);
    expect(meter.event_type).toBe(BILLING_EVENT_DESTINATION_SUBMIT);
  });

  it('blocks origin seal when a failed invoice exists', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ billing_period: '2026-05' }],
      }),
    };
    const service = makeBillingService(pool);

    await expect(service.recordOriginSealMeter('tenant_exporter', 'shp_2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('marks invoice paid from Stripe webhook', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 'inv_1',
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
            stripe_invoice_id: 'in_123',
            finalized_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
          },
        ],
      }),
    };
    const service = makeBillingService(pool);

    const invoice = await service.applyStripeInvoicePaid('in_123');
    expect(invoice?.invoice_status).toBe('PAID');
  });

  it('marks invoice failed from Stripe webhook', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 'inv_2',
            tenant_id: 'tenant_exporter',
            billing_period: '2026-05',
            subscription_amount_eur: 20,
            origin_seal_count: 2,
            origin_seal_amount_eur: 2,
            destination_submit_count: 0,
            destination_submit_amount_eur: 0,
            marketplace_fee_amount_eur: 0,
            total_amount_eur: 22,
            currency: 'EUR',
            invoice_status: 'FAILED',
            stripe_invoice_id: 'in_failed',
            finalized_at: new Date().toISOString(),
            paid_at: null,
          },
        ],
      }),
    };
    const service = makeBillingService(pool);

    const invoice = await service.applyStripeInvoicePaymentFailed('in_failed');
    expect(invoice?.invoice_status).toBe('FAILED');
  });

  it('finalizes monthly invoice with subscription plus usage counts', async () => {
    const invoiceRow = {
      id: 'inv_1',
      tenant_id: 'tenant_exporter',
      billing_period: '2026-06',
      subscription_amount_eur: 40,
      origin_seal_count: 3,
      origin_seal_amount_eur: 3,
      destination_submit_count: 0,
      destination_submit_amount_eur: 0,
      marketplace_fee_amount_eur: 0,
      total_amount_eur: 43,
      currency: 'EUR',
      invoice_status: 'FINALIZED',
      stripe_invoice_id: null,
      finalized_at: new Date().toISOString(),
      paid_at: null,
    };

    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [invoiceRow] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: jest.fn(),
    };

    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            origin_seal_count: 3,
            origin_seal_amount_eur: 3,
            destination_submit_count: 0,
            destination_submit_amount_eur: 0,
          },
        ],
      }),
      connect: jest.fn().mockResolvedValue(client),
    };

    const service = makeBillingService(pool);
    const invoice = await service.finalizeMonthlyInvoice('tenant_exporter', '2026-06', 40);

    expect(invoice.total_amount_eur).toBe(43);
    expect(invoice.origin_seal_count).toBe(3);
    expect(invoice.invoice_status).toBe('FINALIZED');
  });
});
