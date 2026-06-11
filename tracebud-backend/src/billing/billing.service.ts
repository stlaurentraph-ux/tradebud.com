import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import {
  BILLING_DESTINATION_SUBMIT_FEE_EUR,
  BILLING_EVENT_DESTINATION_SUBMIT,
  BILLING_EVENT_ORIGIN_SEAL,
  BILLING_INVOICE_STATUS_FAILED,
  BILLING_INVOICE_STATUS_FINALIZED,
  BILLING_INVOICE_STATUS_PAID,
  BILLING_METER_STATUS_INVOICED,
  BILLING_METER_STATUS_METERED,
  BILLING_ORIGIN_SEAL_FEE_EUR,
  buildDestinationSubmitIdempotencyKey,
  buildOriginSealIdempotencyKey,
  resolveBillingPeriod,
} from './billing.constants';
import {
  AdoptionPromoStatus,
  BillingAdoptionPromoService,
} from './billing-adoption-promo.service';
import { BillingSubscriptionResolverService } from './billing-subscription-resolver.service';
import { StripeBillingService } from './stripe-billing.service';

export type FinalizePeriodResult = {
  invoices: BillingInvoiceRecord[];
  stripeAttempted: number;
  stripeSucceeded: number;
};

export type BillingUsageMeterRecord = {
  id: string;
  tenant_id: string;
  event_type: string;
  amount_eur: number;
  currency: string;
  idempotency_key: string;
  reference_type: string;
  reference_id: string;
  shipment_header_id: string | null;
  dds_record_id: string | null;
  sponsor_tenant_id: string | null;
  payment_method: string;
  meter_status: string;
  billing_period: string;
  occurred_at: string;
  created_at: string;
  replayed?: boolean;
  promo_applied?: boolean;
  promo_code?: string | null;
};

export type BillingUsageSummary = {
  tenant_id: string;
  billing_period: string;
  origin_seal_count: number;
  origin_seal_amount_eur: number;
  destination_submit_count: number;
  destination_submit_amount_eur: number;
  total_usage_amount_eur: number;
  subscription_amount_eur: number;
  projected_invoice_total_eur: number;
  invoice_status: string | null;
  adoption_promo: AdoptionPromoStatus | null;
};

export type BillingInvoiceRecord = {
  id: string;
  tenant_id: string;
  billing_period: string;
  subscription_amount_eur: number;
  origin_seal_count: number;
  origin_seal_amount_eur: number;
  destination_submit_count: number;
  destination_submit_amount_eur: number;
  marketplace_fee_amount_eur: number;
  total_amount_eur: number;
  currency: string;
  invoice_status: string;
  stripe_invoice_id: string | null;
  finalized_at: string | null;
  paid_at: string | null;
};

type RecordUsageMeterInput = {
  tenantId: string;
  eventType: typeof BILLING_EVENT_ORIGIN_SEAL | typeof BILLING_EVENT_DESTINATION_SUBMIT;
  amountEur: number;
  idempotencyKey: string;
  referenceType: string;
  referenceId: string;
  shipmentHeaderId: string;
  ddsRecordId?: string | null;
  sponsorTenantId?: string | null;
  paymentMethod?: string;
  occurredAt?: Date;
};

@Injectable()
export class BillingService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly adoptionPromoService: BillingAdoptionPromoService,
    private readonly subscriptionResolver: BillingSubscriptionResolverService,
    private readonly stripeBilling: StripeBillingService,
  ) {}

  async getAdoptionPromoStatus(tenantId: string): Promise<AdoptionPromoStatus | null> {
    return this.adoptionPromoService.getAdoptionPromoStatus(tenantId);
  }

  private mapMeterRow(row: Record<string, unknown>): BillingUsageMeterRecord {
    return {
      id: String(row.id),
      tenant_id: String(row.tenant_id),
      event_type: String(row.event_type),
      amount_eur: Number(row.amount_eur),
      currency: String(row.currency),
      idempotency_key: String(row.idempotency_key),
      reference_type: String(row.reference_type),
      reference_id: String(row.reference_id),
      shipment_header_id: row.shipment_header_id != null ? String(row.shipment_header_id) : null,
      dds_record_id: row.dds_record_id != null ? String(row.dds_record_id) : null,
      sponsor_tenant_id: row.sponsor_tenant_id != null ? String(row.sponsor_tenant_id) : null,
      payment_method: String(row.payment_method),
      meter_status: String(row.meter_status),
      billing_period: String(row.billing_period),
      occurred_at: new Date(String(row.occurred_at)).toISOString(),
      created_at: new Date(String(row.created_at)).toISOString(),
    };
  }

  private isBillingSchemaMissing(error: unknown): boolean {
    const code = (error as { code?: string } | null)?.code;
    return code === '42P01';
  }

  async assertBillingGateClear(
    tenantId: string,
    gate: 'origin_seal' | 'destination_submit',
  ): Promise<void> {
    try {
      const res = await this.pool.query<{ billing_period: string }>(
        `
          SELECT billing_period
          FROM billing_invoices
          WHERE tenant_id = $1
            AND invoice_status = $2
          ORDER BY billing_period DESC
          LIMIT 1
        `,
        [tenantId, BILLING_INVOICE_STATUS_FAILED],
      );

      if (res.rowCount && res.rowCount > 0) {
        const period = res.rows[0]?.billing_period ?? 'prior';
        const action = gate === 'origin_seal' ? 'seal new shipments' : 'submit new DDS filings';
        throw new ForbiddenException(
          `Outstanding billing for ${period}. Resolve payment before you can ${action}.`,
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (this.isBillingSchemaMissing(error)) {
        return;
      }
      throw error;
    }
  }

  async recordOriginSealMeter(
    tenantId: string,
    shipmentHeaderId: string,
    options?: { sponsorTenantId?: string; paymentMethod?: string },
  ): Promise<BillingUsageMeterRecord> {
    await this.assertBillingGateClear(tenantId, 'origin_seal');

    return this.recordUsageMeter({
      tenantId,
      eventType: BILLING_EVENT_ORIGIN_SEAL,
      amountEur: BILLING_ORIGIN_SEAL_FEE_EUR,
      idempotencyKey: buildOriginSealIdempotencyKey(shipmentHeaderId),
      referenceType: 'shipment_header',
      referenceId: shipmentHeaderId,
      shipmentHeaderId,
      sponsorTenantId: options?.sponsorTenantId ?? null,
      paymentMethod: options?.paymentMethod ?? (options?.sponsorTenantId ? 'SPONSOR_COVERED' : 'CARD'),
    });
  }

  async recordDestinationSubmitMeter(
    tenantId: string,
    shipmentHeaderId: string,
    ddsRecordId: string,
    options?: { sponsorTenantId?: string; paymentMethod?: string },
  ): Promise<BillingUsageMeterRecord> {
    await this.assertBillingGateClear(tenantId, 'destination_submit');

    return this.recordUsageMeter({
      tenantId,
      eventType: BILLING_EVENT_DESTINATION_SUBMIT,
      amountEur: BILLING_DESTINATION_SUBMIT_FEE_EUR,
      idempotencyKey: buildDestinationSubmitIdempotencyKey(shipmentHeaderId),
      referenceType: 'dds_record',
      referenceId: ddsRecordId,
      shipmentHeaderId,
      ddsRecordId,
      sponsorTenantId: options?.sponsorTenantId ?? null,
      paymentMethod: options?.paymentMethod ?? (options?.sponsorTenantId ? 'SPONSOR_COVERED' : 'CARD'),
    });
  }

  private async recordUsageMeter(input: RecordUsageMeterInput): Promise<BillingUsageMeterRecord> {
    const occurredAt = input.occurredAt ?? new Date();
    const billingPeriod = resolveBillingPeriod(occurredAt);
    const leg =
      input.eventType === BILLING_EVENT_ORIGIN_SEAL ? 'origin_seal' : 'destination_submit';

    try {
      const existing = await this.pool.query(
        `
          SELECT *
          FROM billing_usage_meters
          WHERE tenant_id = $1
            AND idempotency_key = $2
          LIMIT 1
        `,
        [input.tenantId, input.idempotencyKey],
      );

      if (existing.rowCount && existing.rows[0]) {
        return { ...this.mapMeterRow(existing.rows[0]), replayed: true };
      }

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        const promoResolution = await this.adoptionPromoService.resolveUsagePromoInTransaction(
          client,
          input.tenantId,
          leg,
          input.amountEur,
        );

        const amountEur = input.sponsorTenantId ? 0 : promoResolution.amount_eur;
        const paymentMethod = input.sponsorTenantId
          ? 'SPONSOR_COVERED'
          : promoResolution.payment_method;
        const meterStatus = input.sponsorTenantId
          ? 'SPONSOR_COVERED'
          : promoResolution.meter_status;

        const inserted = await client.query(
          `
            INSERT INTO billing_usage_meters (
              tenant_id,
              event_type,
              amount_eur,
              idempotency_key,
              reference_type,
              reference_id,
              shipment_header_id,
              dds_record_id,
              sponsor_tenant_id,
              payment_method,
              meter_status,
              billing_period,
              occurred_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
          `,
          [
            input.tenantId,
            input.eventType,
            amountEur,
            input.idempotencyKey,
            input.referenceType,
            input.referenceId,
            input.shipmentHeaderId,
            input.ddsRecordId ?? null,
            input.sponsorTenantId ?? null,
            paymentMethod,
            meterStatus,
            billingPeriod,
            occurredAt.toISOString(),
          ],
        );

        const meter = inserted.rows[0];

        await client.query(
          `
            INSERT INTO shipment_billing_legs (
              shipment_header_id,
              leg,
              billing_tenant_id,
              billing_usage_meter_id
            )
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (shipment_header_id, leg) DO NOTHING
          `,
          [input.shipmentHeaderId, leg, input.tenantId, meter.id],
        );

        await client.query('COMMIT');
        return {
          ...this.mapMeterRow(meter),
          promo_applied: promoResolution.promo_applied,
          promo_code: promoResolution.promo_code,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        throw new ServiceUnavailableException('Billing metering tables are not provisioned.');
      }
      throw error;
    }
  }

  async listUsageMeters(
    tenantId: string,
    billingPeriod?: string,
  ): Promise<BillingUsageMeterRecord[]> {
    const period = billingPeriod?.trim() || resolveBillingPeriod();

    try {
      const res = await this.pool.query(
        `
          SELECT *
          FROM billing_usage_meters
          WHERE tenant_id = $1
            AND billing_period = $2
          ORDER BY occurred_at DESC
        `,
        [tenantId, period],
      );

      return res.rows.map((row) => this.mapMeterRow(row));
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        return [];
      }
      throw error;
    }
  }

  async getUsageSummary(tenantId: string, billingPeriod?: string): Promise<BillingUsageSummary> {
    const period = billingPeriod?.trim() || resolveBillingPeriod();

    try {
      const usageRes = await this.pool.query<{
        origin_seal_count: string;
        origin_seal_amount_eur: string;
        destination_submit_count: string;
        destination_submit_amount_eur: string;
      }>(
        `
          SELECT
            COUNT(*) FILTER (WHERE event_type = $3)::int AS origin_seal_count,
            COALESCE(SUM(amount_eur) FILTER (WHERE event_type = $3), 0)::numeric AS origin_seal_amount_eur,
            COUNT(*) FILTER (WHERE event_type = $4)::int AS destination_submit_count,
            COALESCE(SUM(amount_eur) FILTER (WHERE event_type = $4), 0)::numeric AS destination_submit_amount_eur
          FROM billing_usage_meters
          WHERE tenant_id = $1
            AND billing_period = $2
            AND meter_status IN ($5, $6, $7)
            AND amount_eur > 0
        `,
        [
          tenantId,
          period,
          BILLING_EVENT_ORIGIN_SEAL,
          BILLING_EVENT_DESTINATION_SUBMIT,
          BILLING_METER_STATUS_METERED,
          BILLING_METER_STATUS_INVOICED,
          'SPONSOR_COVERED',
        ],
      );

      const adoptionPromo = await this.adoptionPromoService.getAdoptionPromoStatus(tenantId);

      const invoiceRes = await this.pool.query<{
        subscription_amount_eur: string;
        total_amount_eur: string;
        invoice_status: string;
      }>(
        `
          SELECT subscription_amount_eur, total_amount_eur, invoice_status
          FROM billing_invoices
          WHERE tenant_id = $1
            AND billing_period = $2
          LIMIT 1
        `,
        [tenantId, period],
      );

      const usage = usageRes.rows[0];
      const originSealCount = Number(usage?.origin_seal_count ?? 0);
      const destinationSubmitCount = Number(usage?.destination_submit_count ?? 0);
      const originSealAmount = Number(usage?.origin_seal_amount_eur ?? 0);
      const destinationSubmitAmount = Number(usage?.destination_submit_amount_eur ?? 0);
      const totalUsage = originSealAmount + destinationSubmitAmount;
      const invoiceSubscription = invoiceRes.rows[0]?.subscription_amount_eur;
      const resolvedSubscription = await this.subscriptionResolver.resolveMonthlySubscriptionEur(
        tenantId,
      );
      const subscriptionListPrice =
        invoiceSubscription != null
          ? Number(invoiceSubscription)
          : resolvedSubscription.amount_eur;
      const subscriptionAmount =
        adoptionPromo?.subscription_free_active === true ? 0 : subscriptionListPrice;
      const invoiceStatus = invoiceRes.rows[0]?.invoice_status ?? null;
      const projectedTotal =
        invoiceRes.rows[0]?.total_amount_eur != null
          ? Number(invoiceRes.rows[0].total_amount_eur)
          : subscriptionAmount + totalUsage;

      return {
        tenant_id: tenantId,
        billing_period: period,
        origin_seal_count: originSealCount,
        origin_seal_amount_eur: originSealAmount,
        destination_submit_count: destinationSubmitCount,
        destination_submit_amount_eur: destinationSubmitAmount,
        total_usage_amount_eur: totalUsage,
        subscription_amount_eur: subscriptionAmount,
        projected_invoice_total_eur: projectedTotal,
        invoice_status: invoiceStatus,
        adoption_promo: adoptionPromo,
      };
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        return {
          tenant_id: tenantId,
          billing_period: period,
          origin_seal_count: 0,
          origin_seal_amount_eur: 0,
          destination_submit_count: 0,
          destination_submit_amount_eur: 0,
          total_usage_amount_eur: 0,
          subscription_amount_eur: 0,
          projected_invoice_total_eur: 0,
          invoice_status: null,
          adoption_promo: null,
        };
      }
      throw error;
    }
  }

  async finalizeAllTenantInvoicesForPeriod(billingPeriod: string): Promise<FinalizePeriodResult> {
    if (!/^\d{4}-\d{2}$/.test(billingPeriod)) {
      throw new BadRequestException('billingPeriod must use YYYY-MM format.');
    }

    try {
      const tenantIds =
        await this.subscriptionResolver.listBillableTenantIdsForPeriod(billingPeriod);

      const invoices: BillingInvoiceRecord[] = [];
      let stripeAttempted = 0;
      let stripeSucceeded = 0;

      for (const tenantId of tenantIds) {
        const subscriptionBreakdown =
          await this.subscriptionResolver.resolveMonthlySubscriptionEur(tenantId);
        const invoice = await this.finalizeMonthlyInvoice(
          tenantId,
          billingPeriod,
          subscriptionBreakdown.amount_eur,
        );
        if (this.stripeBilling.isEnabled() && invoice.total_amount_eur > 0) {
          stripeAttempted += 1;
          if (invoice.stripe_invoice_id) {
            stripeSucceeded += 1;
          }
        }
        invoices.push(invoice);
      }

      return { invoices, stripeAttempted, stripeSucceeded };
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        throw new ServiceUnavailableException('Billing metering tables are not provisioned.');
      }
      throw error;
    }
  }

  private async attemptStripeChargeForInvoice(
    invoice: BillingInvoiceRecord,
    billingPeriod: string,
  ): Promise<BillingInvoiceRecord> {
    if (!this.stripeBilling.isEnabled() || invoice.total_amount_eur <= 0) {
      return invoice;
    }

    const stripeCustomerId = await this.subscriptionResolver.getStripeCustomerId(invoice.tenant_id);
    if (!stripeCustomerId) {
      return invoice;
    }

    try {
      const stripeInvoiceId = await this.stripeBilling.createAndFinalizeInvoice(
        invoice,
        stripeCustomerId,
        billingPeriod,
      );
      if (!stripeInvoiceId) {
        return invoice;
      }

      const updated = await this.pool.query(
        `
          UPDATE billing_invoices
          SET stripe_invoice_id = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [invoice.id, stripeInvoiceId],
      );
      const row = updated.rows[0];
      if (!row) {
        return { ...invoice, stripe_invoice_id: stripeInvoiceId };
      }
      return {
        ...invoice,
        stripe_invoice_id: stripeInvoiceId,
      };
    } catch {
      return invoice;
    }
  }

  async applyStripeInvoicePaid(stripeInvoiceId: string, paidAt?: Date): Promise<BillingInvoiceRecord | null> {
    const normalizedStripeId = stripeInvoiceId.trim();
    if (!normalizedStripeId) {
      return null;
    }

    try {
      const res = await this.pool.query(
        `
          UPDATE billing_invoices
          SET invoice_status = $2,
              paid_at = COALESCE($3, NOW()),
              updated_at = NOW()
          WHERE stripe_invoice_id = $1
          RETURNING *
        `,
        [normalizedStripeId, BILLING_INVOICE_STATUS_PAID, paidAt ?? null],
      );

      if (!res.rowCount) {
        return null;
      }

      const row = res.rows[0];
      return {
        id: String(row.id),
        tenant_id: String(row.tenant_id),
        billing_period: String(row.billing_period),
        subscription_amount_eur: Number(row.subscription_amount_eur),
        origin_seal_count: Number(row.origin_seal_count),
        origin_seal_amount_eur: Number(row.origin_seal_amount_eur),
        destination_submit_count: Number(row.destination_submit_count),
        destination_submit_amount_eur: Number(row.destination_submit_amount_eur),
        marketplace_fee_amount_eur: Number(row.marketplace_fee_amount_eur ?? 0),
        total_amount_eur: Number(row.total_amount_eur),
        currency: String(row.currency),
        invoice_status: String(row.invoice_status),
        stripe_invoice_id: row.stripe_invoice_id != null ? String(row.stripe_invoice_id) : null,
        finalized_at: row.finalized_at != null ? new Date(String(row.finalized_at)).toISOString() : null,
        paid_at: row.paid_at != null ? new Date(String(row.paid_at)).toISOString() : null,
      };
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  async applyStripeInvoicePaymentFailed(stripeInvoiceId: string): Promise<BillingInvoiceRecord | null> {
    const normalizedStripeId = stripeInvoiceId.trim();
    if (!normalizedStripeId) {
      return null;
    }

    try {
      const res = await this.pool.query(
        `
          UPDATE billing_invoices
          SET invoice_status = $2,
              updated_at = NOW()
          WHERE stripe_invoice_id = $1
            AND invoice_status <> $3
          RETURNING *
        `,
        [normalizedStripeId, BILLING_INVOICE_STATUS_FAILED, BILLING_INVOICE_STATUS_PAID],
      );

      if (!res.rowCount) {
        return null;
      }

      const row = res.rows[0];
      return {
        id: String(row.id),
        tenant_id: String(row.tenant_id),
        billing_period: String(row.billing_period),
        subscription_amount_eur: Number(row.subscription_amount_eur),
        origin_seal_count: Number(row.origin_seal_count),
        origin_seal_amount_eur: Number(row.origin_seal_amount_eur),
        destination_submit_count: Number(row.destination_submit_count),
        destination_submit_amount_eur: Number(row.destination_submit_amount_eur),
        marketplace_fee_amount_eur: Number(row.marketplace_fee_amount_eur ?? 0),
        total_amount_eur: Number(row.total_amount_eur),
        currency: String(row.currency),
        invoice_status: String(row.invoice_status),
        stripe_invoice_id: row.stripe_invoice_id != null ? String(row.stripe_invoice_id) : null,
        finalized_at: row.finalized_at != null ? new Date(String(row.finalized_at)).toISOString() : null,
        paid_at: row.paid_at != null ? new Date(String(row.paid_at)).toISOString() : null,
      };
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  async handleStripeWebhookEvent(event: {
    type: string;
    data: { object: { id?: string; metadata?: Record<string, string>; status_transitions?: { paid_at?: number } } };
  }): Promise<{ handled: boolean; invoiceId?: string; eventType: string }> {
    const stripeInvoiceId = event.data.object.id?.trim();
    if (!stripeInvoiceId) {
      return { handled: false, eventType: event.type };
    }

    if (event.type === 'invoice.paid') {
      const paidAtSeconds = event.data.object.status_transitions?.paid_at;
      const paidAt =
        paidAtSeconds != null && Number.isFinite(paidAtSeconds)
          ? new Date(paidAtSeconds * 1000)
          : undefined;
      const invoice = await this.applyStripeInvoicePaid(stripeInvoiceId, paidAt);
      return {
        handled: Boolean(invoice),
        invoiceId: invoice?.id,
        eventType: event.type,
      };
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = await this.applyStripeInvoicePaymentFailed(stripeInvoiceId);
      return {
        handled: Boolean(invoice),
        invoiceId: invoice?.id,
        eventType: event.type,
      };
    }

    return { handled: false, eventType: event.type };
  }

  async finalizeMonthlyInvoice(
    tenantId: string,
    billingPeriod: string,
    subscriptionListPriceEur = 0,
  ): Promise<BillingInvoiceRecord> {
    if (!/^\d{4}-\d{2}$/.test(billingPeriod)) {
      throw new BadRequestException('billingPeriod must use YYYY-MM format.');
    }

    try {
      const usageRes = await this.pool.query<{
        origin_seal_count: string;
        origin_seal_amount_eur: string;
        destination_submit_count: string;
        destination_submit_amount_eur: string;
      }>(
        `
          SELECT
            COUNT(*) FILTER (WHERE event_type = $3)::int AS origin_seal_count,
            COALESCE(SUM(amount_eur) FILTER (WHERE event_type = $3), 0)::numeric AS origin_seal_amount_eur,
            COUNT(*) FILTER (WHERE event_type = $4)::int AS destination_submit_count,
            COALESCE(SUM(amount_eur) FILTER (WHERE event_type = $4), 0)::numeric AS destination_submit_amount_eur
          FROM billing_usage_meters
          WHERE tenant_id = $1
            AND billing_period = $2
            AND meter_status = $5
        `,
        [
          tenantId,
          billingPeriod,
          BILLING_EVENT_ORIGIN_SEAL,
          BILLING_EVENT_DESTINATION_SUBMIT,
          BILLING_METER_STATUS_METERED,
        ],
      );

      const usage = usageRes.rows[0];
      const originSealCount = Number(usage?.origin_seal_count ?? 0);
      const destinationSubmitCount = Number(usage?.destination_submit_count ?? 0);
      const originSealAmount = Number(usage?.origin_seal_amount_eur ?? 0);
      const destinationSubmitAmount = Number(usage?.destination_submit_amount_eur ?? 0);
      const subscriptionFree = await this.adoptionPromoService.isSubscriptionFree(tenantId);
      const subscriptionAmountEur = subscriptionFree ? 0 : subscriptionListPriceEur;
      const totalAmount = subscriptionAmountEur + originSealAmount + destinationSubmitAmount;

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        const invoiceRes = await client.query(
          `
            INSERT INTO billing_invoices (
              tenant_id,
              billing_period,
              subscription_amount_eur,
              origin_seal_count,
              origin_seal_amount_eur,
              destination_submit_count,
              destination_submit_amount_eur,
              total_amount_eur,
              invoice_status,
              finalized_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT (tenant_id, billing_period) DO UPDATE
            SET
              subscription_amount_eur = EXCLUDED.subscription_amount_eur,
              origin_seal_count = EXCLUDED.origin_seal_count,
              origin_seal_amount_eur = EXCLUDED.origin_seal_amount_eur,
              destination_submit_count = EXCLUDED.destination_submit_count,
              destination_submit_amount_eur = EXCLUDED.destination_submit_amount_eur,
              total_amount_eur = EXCLUDED.total_amount_eur,
              invoice_status = CASE
                WHEN billing_invoices.invoice_status IN ($10, $11) THEN billing_invoices.invoice_status
                ELSE EXCLUDED.invoice_status
              END,
              finalized_at = COALESCE(billing_invoices.finalized_at, NOW()),
              updated_at = NOW()
            RETURNING *
          `,
          [
            tenantId,
            billingPeriod,
            subscriptionAmountEur,
            originSealCount,
            originSealAmount,
            destinationSubmitCount,
            destinationSubmitAmount,
            totalAmount,
            BILLING_INVOICE_STATUS_FINALIZED,
            BILLING_INVOICE_STATUS_PAID,
            BILLING_INVOICE_STATUS_FAILED,
          ],
        );

        await client.query(
          `
            UPDATE billing_usage_meters
            SET meter_status = $4
            WHERE tenant_id = $1
              AND billing_period = $2
              AND meter_status = $3
          `,
          [tenantId, billingPeriod, BILLING_METER_STATUS_METERED, BILLING_METER_STATUS_INVOICED],
        );

        await client.query('COMMIT');

        const row = invoiceRes.rows[0];
        const invoice: BillingInvoiceRecord = {
          id: String(row.id),
          tenant_id: String(row.tenant_id),
          billing_period: String(row.billing_period),
          subscription_amount_eur: Number(row.subscription_amount_eur),
          origin_seal_count: Number(row.origin_seal_count),
          origin_seal_amount_eur: Number(row.origin_seal_amount_eur),
          destination_submit_count: Number(row.destination_submit_count),
          destination_submit_amount_eur: Number(row.destination_submit_amount_eur),
          marketplace_fee_amount_eur: Number(row.marketplace_fee_amount_eur ?? 0),
          total_amount_eur: Number(row.total_amount_eur),
          currency: String(row.currency),
          invoice_status: String(row.invoice_status),
          stripe_invoice_id: row.stripe_invoice_id != null ? String(row.stripe_invoice_id) : null,
          finalized_at: row.finalized_at != null ? new Date(String(row.finalized_at)).toISOString() : null,
          paid_at: row.paid_at != null ? new Date(String(row.paid_at)).toISOString() : null,
        };
        return this.attemptStripeChargeForInvoice(invoice, billingPeriod);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (this.isBillingSchemaMissing(error)) {
        throw new ServiceUnavailableException('Billing metering tables are not provisioned.');
      }
      throw error;
    }
  }
}
