import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../db/db.module';
import {
  BILLING_DESTINATION_SUBMIT_FEE_EUR,
  BILLING_ORIGIN_SEAL_FEE_EUR,
} from './billing.constants';

export const ADOPTION_SUBSCRIPTION_FREE_MONTHS = 3;

export type AdoptionPromoStatus = {
  tenant_id: string;
  adoption_started_at: string;
  subscription_free_until: string;
  subscription_free_active: boolean;
  subscription_promo_forfeited: boolean;
  subscription_billing_starts_at: string | null;
  first_origin_seal_available: boolean;
  first_destination_submit_available: boolean;
  first_origin_seal_waived_at: string | null;
  first_destination_submit_waived_at: string | null;
};

export function endOfUtcCalendarMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function startOfNextUtcCalendarMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export type UsagePromoResolution = {
  amount_eur: number;
  payment_method: string;
  meter_status: string;
  promo_applied: boolean;
  promo_code: string | null;
};

type PromoRow = {
  tenant_id: string;
  adoption_started_at: string;
  subscription_free_until: string;
  subscription_promo_forfeited_at: string | null;
  first_origin_seal_waived_at: string | null;
  first_destination_submit_waived_at: string | null;
};

@Injectable()
export class BillingAdoptionPromoService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private isSchemaMissing(error: unknown): boolean {
    return (error as { code?: string } | null)?.code === '42P01';
  }

  private mapStatus(row: PromoRow): AdoptionPromoStatus {
    const now = Date.now();
    const freeUntilDate = new Date(row.subscription_free_until);
    const freeUntil = freeUntilDate.getTime();
    const forfeited = row.subscription_promo_forfeited_at != null;
    return {
      tenant_id: row.tenant_id,
      adoption_started_at: new Date(row.adoption_started_at).toISOString(),
      subscription_free_until: freeUntilDate.toISOString(),
      subscription_free_active: freeUntil > now,
      subscription_promo_forfeited: forfeited,
      subscription_billing_starts_at: forfeited
        ? startOfNextUtcCalendarMonth(freeUntilDate).toISOString()
        : null,
      first_origin_seal_available: row.first_origin_seal_waived_at == null,
      first_destination_submit_available: row.first_destination_submit_waived_at == null,
      first_origin_seal_waived_at: row.first_origin_seal_waived_at
        ? new Date(row.first_origin_seal_waived_at).toISOString()
        : null,
      first_destination_submit_waived_at: row.first_destination_submit_waived_at
        ? new Date(row.first_destination_submit_waived_at).toISOString()
        : null,
    };
  }

  async ensureAdoptionPromo(tenantId: string): Promise<AdoptionPromoStatus | null> {
    try {
      const insertRes = await this.pool.query<PromoRow>(
        `
          INSERT INTO tenant_billing_adoption_promo (
            tenant_id,
            adoption_started_at,
            subscription_free_until
          )
          VALUES (
            $1,
            NOW(),
            NOW() + ($2::int * INTERVAL '1 month')
          )
          ON CONFLICT (tenant_id) DO NOTHING
          RETURNING *
        `,
        [tenantId, ADOPTION_SUBSCRIPTION_FREE_MONTHS],
      );

      if (insertRes.rowCount && insertRes.rows[0]) {
        return this.mapStatus(insertRes.rows[0]);
      }

      const existing = await this.pool.query<PromoRow>(
        `SELECT * FROM tenant_billing_adoption_promo WHERE tenant_id = $1`,
        [tenantId],
      );
      return existing.rows[0] ? this.mapStatus(existing.rows[0]) : null;
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  async getAdoptionPromoStatus(tenantId: string): Promise<AdoptionPromoStatus | null> {
    return this.ensureAdoptionPromo(tenantId);
  }

  async isSubscriptionFree(tenantId: string): Promise<boolean> {
    const status = await this.getAdoptionPromoStatus(tenantId);
    return status?.subscription_free_active ?? false;
  }

  private async forfeitSubscriptionPromoAfterFreeShipment(
    client: PoolClient,
    tenantId: string,
    waivedAt: Date,
  ): Promise<void> {
    const endOfWaiverMonth = endOfUtcCalendarMonth(waivedAt);
    await client.query(
      `
        UPDATE tenant_billing_adoption_promo
        SET
          subscription_free_until = LEAST(subscription_free_until, $2::timestamptz),
          subscription_promo_forfeited_at = COALESCE(subscription_promo_forfeited_at, NOW()),
          updated_at = NOW()
        WHERE tenant_id = $1
      `,
      [tenantId, endOfWaiverMonth.toISOString()],
    );
  }

  async resolveUsagePromoInTransaction(
    client: PoolClient,
    tenantId: string,
    leg: 'origin_seal' | 'destination_submit',
    defaultAmountEur: number,
  ): Promise<UsagePromoResolution> {
    await client.query(
      `
        INSERT INTO tenant_billing_adoption_promo (
          tenant_id,
          adoption_started_at,
          subscription_free_until
        )
        VALUES ($1, NOW(), NOW() + ($2::int * INTERVAL '1 month'))
        ON CONFLICT (tenant_id) DO NOTHING
      `,
      [tenantId, ADOPTION_SUBSCRIPTION_FREE_MONTHS],
    );

    const locked = await client.query<PromoRow>(
      `
        SELECT *
        FROM tenant_billing_adoption_promo
        WHERE tenant_id = $1
        FOR UPDATE
      `,
      [tenantId],
    );

    const row = locked.rows[0];
    if (!row) {
      return {
        amount_eur: defaultAmountEur,
        payment_method: 'CARD',
        meter_status: 'METERED',
        promo_applied: false,
        promo_code: null,
      };
    }

    if (leg === 'origin_seal' && row.first_origin_seal_waived_at == null) {
      const waivedAt = new Date();
      await client.query(
        `
          UPDATE tenant_billing_adoption_promo
          SET first_origin_seal_waived_at = NOW(), updated_at = NOW()
          WHERE tenant_id = $1
        `,
        [tenantId],
      );
      await this.forfeitSubscriptionPromoAfterFreeShipment(client, tenantId, waivedAt);
      return {
        amount_eur: 0,
        payment_method: 'WAIVED',
        meter_status: 'WAIVED',
        promo_applied: true,
        promo_code: 'ADOPTION_FIRST_ORIGIN_SEAL',
      };
    }

    if (leg === 'destination_submit' && row.first_destination_submit_waived_at == null) {
      const waivedAt = new Date();
      await client.query(
        `
          UPDATE tenant_billing_adoption_promo
          SET first_destination_submit_waived_at = NOW(), updated_at = NOW()
          WHERE tenant_id = $1
        `,
        [tenantId],
      );
      await this.forfeitSubscriptionPromoAfterFreeShipment(client, tenantId, waivedAt);
      return {
        amount_eur: 0,
        payment_method: 'WAIVED',
        meter_status: 'WAIVED',
        promo_applied: true,
        promo_code: 'ADOPTION_FIRST_DESTINATION_SUBMIT',
      };
    }

    return {
      amount_eur: defaultAmountEur,
      payment_method: 'CARD',
      meter_status: 'METERED',
      promo_applied: false,
      promo_code: null,
    };
  }

  static defaultAmountForLeg(leg: 'origin_seal' | 'destination_submit'): number {
    return leg === 'origin_seal' ? BILLING_ORIGIN_SEAL_FEE_EUR : BILLING_DESTINATION_SUBMIT_FEE_EUR;
  }
}
