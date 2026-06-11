import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { startOfNextUtcCalendarMonth } from './billing-adoption-promo.service';
import {
  BillingBand,
  inferBillingBandFromTeamSize,
  parseBillingBand,
  parseSubscriptionBundleKey,
  parseSubscriptionModuleKey,
  resolveSubscriptionPriceEur,
  SubscriptionBundleKey,
  SubscriptionModuleKey,
  SubscriptionPriceBreakdown,
} from './billing-subscription-pricing';

export type SubscriptionRow = {
  tenant_id: string;
  billing_band: BillingBand;
  subscription_bundle: SubscriptionBundleKey | null;
  enabled_modules: string[];
  subscription_billing_enabled: boolean;
  stripe_customer_id: string | null;
  pending_billing_band: BillingBand | null;
  band_upgrade_accepted_at: string | null;
  band_effective_from: string | null;
  enterprise_contract_active: boolean;
};

const MVP_DEFAULT_BUNDLE: SubscriptionBundleKey = 'compliance_starter';

@Injectable()
export class BillingSubscriptionResolverService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private isSchemaMissing(error: unknown): boolean {
    return (error as { code?: string } | null)?.code === '42P01';
  }

  private mapModules(raw: string[] | null | undefined): SubscriptionModuleKey[] {
    if (!raw?.length) {
      return ['foundation', 'eudr'];
    }
    const parsed = raw
      .map((value) => parseSubscriptionModuleKey(value))
      .filter((value): value is SubscriptionModuleKey => value != null);
    return parsed.length > 0 ? parsed : ['foundation', 'eudr'];
  }

  async ensureDefaultSubscription(tenantId: string): Promise<void> {
    try {
      const profileRes = await this.pool.query<{ team_size: string | null }>(
        `
          SELECT team_size
          FROM tenant_commercial_profiles
          WHERE tenant_id = $1
          LIMIT 1
        `,
        [tenantId],
      );
      const billingBand = inferBillingBandFromTeamSize(profileRes.rows[0]?.team_size);

      await this.pool.query(
        `
          INSERT INTO tenant_billing_subscription (
            tenant_id,
            billing_band,
            subscription_bundle,
            enabled_modules,
            subscription_billing_enabled,
            updated_at
          )
          VALUES ($1, $2, $3, ARRAY['foundation', 'eudr']::TEXT[], TRUE, NOW())
          ON CONFLICT (tenant_id) DO NOTHING
        `,
        [tenantId, billingBand, MVP_DEFAULT_BUNDLE],
      );
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return;
      }
      throw error;
    }
  }

  async getSubscriptionRow(tenantId: string): Promise<SubscriptionRow | null> {
    try {
      const res = await this.pool.query(
        `
          SELECT
            tenant_id,
            billing_band,
            subscription_bundle,
            enabled_modules,
            subscription_billing_enabled,
            stripe_customer_id,
            pending_billing_band,
            band_upgrade_accepted_at,
            band_effective_from,
            enterprise_contract_active
          FROM tenant_billing_subscription
          WHERE tenant_id = $1
          LIMIT 1
        `,
        [tenantId],
      );
      const row = res.rows[0];
      if (!row) {
        return null;
      }
      return this.mapSubscriptionRow(row);
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  private mapSubscriptionRow(row: Record<string, unknown>): SubscriptionRow {
    return {
      tenant_id: String(row.tenant_id),
      billing_band: parseBillingBand(String(row.billing_band)) ?? 'starter',
      subscription_bundle:
        row.subscription_bundle != null
          ? parseSubscriptionBundleKey(String(row.subscription_bundle))
          : null,
      enabled_modules: Array.isArray(row.enabled_modules)
        ? row.enabled_modules.map((value) => String(value))
        : [],
      subscription_billing_enabled: row.subscription_billing_enabled === true,
      stripe_customer_id:
        row.stripe_customer_id != null ? String(row.stripe_customer_id) : null,
      pending_billing_band:
        row.pending_billing_band != null
          ? parseBillingBand(String(row.pending_billing_band))
          : null,
      band_upgrade_accepted_at:
        row.band_upgrade_accepted_at != null
          ? new Date(String(row.band_upgrade_accepted_at)).toISOString()
          : null,
      band_effective_from:
        row.band_effective_from != null
          ? new Date(String(row.band_effective_from)).toISOString()
          : null,
      enterprise_contract_active: row.enterprise_contract_active === true,
    };
  }

  resolveContactLimitBand(row: SubscriptionRow): BillingBand {
    if (row.pending_billing_band && row.band_upgrade_accepted_at) {
      return row.pending_billing_band;
    }
    return row.billing_band;
  }

  async applyScheduledBandUpgrades(tenantId: string): Promise<void> {
    try {
      await this.pool.query(
        `
          UPDATE tenant_billing_subscription
          SET
            billing_band = pending_billing_band,
            pending_billing_band = NULL,
            band_upgrade_accepted_at = NULL,
            band_effective_from = NULL,
            updated_at = NOW()
          WHERE tenant_id = $1
            AND pending_billing_band IS NOT NULL
            AND band_effective_from IS NOT NULL
            AND band_effective_from <= NOW()
        `,
        [tenantId],
      );
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return;
      }
      throw error;
    }
  }

  async acceptBandUpgrade(
    tenantId: string,
    targetBand: BillingBand,
  ): Promise<SubscriptionRow> {
    await this.ensureDefaultSubscription(tenantId);
    const effectiveFrom = startOfNextUtcCalendarMonth();

    const result = await this.pool.query(
      `
        UPDATE tenant_billing_subscription
        SET
          pending_billing_band = $2,
          band_upgrade_accepted_at = NOW(),
          band_effective_from = $3,
          updated_at = NOW()
        WHERE tenant_id = $1
        RETURNING *
      `,
      [tenantId, targetBand, effectiveFrom.toISOString()],
    );

    const row = result.rows[0];
    if (!row) {
      await this.ensureDefaultSubscription(tenantId);
      throw new Error('Subscription row missing after upgrade acceptance.');
    }

    return this.mapSubscriptionRow(row);
  }

  async resolveMonthlySubscriptionEur(tenantId: string): Promise<SubscriptionPriceBreakdown> {
    await this.ensureDefaultSubscription(tenantId);
    await this.applyScheduledBandUpgrades(tenantId);
    const row = await this.getSubscriptionRow(tenantId);

    if (!row || row.subscription_billing_enabled !== true) {
      return {
        billing_band: 'starter',
        subscription_bundle: null,
        enabled_modules: [],
        amount_eur: 0,
        pricing_source: 'none',
      };
    }

    const bundle =
      row.subscription_bundle != null
        ? parseSubscriptionBundleKey(row.subscription_bundle) ?? MVP_DEFAULT_BUNDLE
        : null;

    return resolveSubscriptionPriceEur({
      billingBand: row.billing_band,
      subscriptionBundle: bundle,
      enabledModules: this.mapModules(row.enabled_modules),
    });
  }

  async getStripeCustomerId(tenantId: string): Promise<string | null> {
    const row = await this.getSubscriptionRow(tenantId);
    return row?.stripe_customer_id?.trim() || null;
  }

  async listBillableTenantIdsForPeriod(billingPeriod: string): Promise<string[]> {
    try {
      const res = await this.pool.query<{ tenant_id: string }>(
        `
          SELECT DISTINCT tenant_id
          FROM (
            SELECT tenant_id
            FROM billing_usage_meters
            WHERE billing_period = $1
              AND meter_status = $2
            UNION
            SELECT tenant_id
            FROM tenant_billing_subscription
            WHERE subscription_billing_enabled = TRUE
            UNION
            SELECT tenant_id
            FROM tenant_trial_state
            WHERE lifecycle_status IN ('trial_active', 'paid_active')
          ) candidates
          ORDER BY tenant_id ASC
        `,
        [billingPeriod, 'METERED'],
      );
      return res.rows.map((row) => row.tenant_id);
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        const fallback = await this.pool.query<{ tenant_id: string }>(
          `
            SELECT DISTINCT tenant_id
            FROM billing_usage_meters
            WHERE billing_period = $1
              AND meter_status = $2
            ORDER BY tenant_id ASC
          `,
          [billingPeriod, 'METERED'],
        );
        return fallback.rows.map((row) => row.tenant_id);
      }
      throw error;
    }
  }
}
