import { createHmac, timingSafeEqual } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BillingInvoiceRecord } from './billing.service';

type StripeInvoiceResponse = {
  id?: string;
  status?: string;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      metadata?: Record<string, string>;
      status_transitions?: { paid_at?: number };
    };
  };
};

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

@Injectable()
export class StripeBillingService {
  private readonly logger = new Logger(StripeBillingService.name);

  isEnabled(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }

  isWebhookEnabled(): boolean {
    return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  }

  private getWebhookSecret(): string {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured.');
    }
    return secret;
  }

  constructWebhookEvent(rawBody: Buffer | string, signatureHeader: string | undefined): StripeWebhookEvent {
    if (!signatureHeader?.trim()) {
      throw new BadRequestException('Missing Stripe-Signature header.');
    }

    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const secret = this.getWebhookSecret();
    const parts = signatureHeader.split(',').map((part) => part.trim());
    let timestamp = '';
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = value ?? '';
      } else if (key === 'v1' && value) {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      throw new BadRequestException('Invalid Stripe-Signature header.');
    }

    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
      throw new BadRequestException('Stripe webhook timestamp outside tolerance.');
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const verified = signatures.some((signature) => {
      try {
        const received = Buffer.from(signature, 'hex');
        return (
          received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer)
        );
      } catch {
        return false;
      }
    });

    if (!verified) {
      throw new BadRequestException('Stripe webhook signature verification failed.');
    }

    try {
      return JSON.parse(payload) as StripeWebhookEvent;
    } catch {
      throw new BadRequestException('Stripe webhook payload is not valid JSON.');
    }
  }

  private getSecretKey(): string {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    return secret;
  }

  private async stripePost<T>(
    path: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      body.set(key, String(value));
    }

    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Stripe request failed (${response.status}).`);
    }
    return payload;
  }

  async createAndFinalizeInvoice(
    invoice: BillingInvoiceRecord,
    stripeCustomerId: string,
    billingPeriod: string,
  ): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }
    if (invoice.stripe_invoice_id) {
      return invoice.stripe_invoice_id;
    }
    if (invoice.total_amount_eur <= 0) {
      return null;
    }

    const customerId = stripeCustomerId.trim();
    if (!customerId) {
      return null;
    }

    const idempotencyBase = `${invoice.tenant_id}:${billingPeriod}`;

    if (invoice.subscription_amount_eur > 0) {
      await this.stripePost('/invoiceitems', {
        customer: customerId,
        amount: Math.round(invoice.subscription_amount_eur * 100),
        currency: 'eur',
        description: `Tracebud subscription (${billingPeriod})`,
        'metadata[tenant_id]': invoice.tenant_id,
        'metadata[billing_period]': billingPeriod,
        'metadata[line_type]': 'subscription',
      });
    }

    if (invoice.origin_seal_count > 0 && invoice.origin_seal_amount_eur > 0) {
      await this.stripePost('/invoiceitems', {
        customer: customerId,
        amount: Math.round(invoice.origin_seal_amount_eur * 100),
        currency: 'eur',
        description: `Origin shipment seals (${invoice.origin_seal_count} × €1)`,
        'metadata[tenant_id]': invoice.tenant_id,
        'metadata[billing_period]': billingPeriod,
        'metadata[line_type]': 'origin_seal',
      });
    }

    if (invoice.destination_submit_count > 0 && invoice.destination_submit_amount_eur > 0) {
      await this.stripePost('/invoiceitems', {
        customer: customerId,
        amount: Math.round(invoice.destination_submit_amount_eur * 100),
        currency: 'eur',
        description: `Destination DDS submits (${invoice.destination_submit_count} × €1)`,
        'metadata[tenant_id]': invoice.tenant_id,
        'metadata[billing_period]': billingPeriod,
        'metadata[line_type]': 'destination_submit',
      });
    }

    const draft = await this.stripePost<StripeInvoiceResponse>('/invoices', {
      customer: customerId,
      auto_advance: 'true',
      collection_method: 'charge_automatically',
      'metadata[tenant_id]': invoice.tenant_id,
      'metadata[billing_period]': billingPeriod,
      'metadata[tracebud_invoice_id]': invoice.id,
    });

    if (!draft.id) {
      throw new Error('Stripe invoice creation did not return an id.');
    }

    const finalized = await this.stripePost<StripeInvoiceResponse>(
      `/invoices/${draft.id}/finalize`,
      {},
    );

    this.logger.log(
      `Stripe invoice ${finalized.id ?? draft.id} finalized for tenant ${invoice.tenant_id} (${billingPeriod}).`,
    );

    return finalized.id ?? draft.id;
  }
}
