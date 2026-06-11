import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import {
  BILLING_BAND_UPGRADE_REQUIRED,
  ENTERPRISE_SALES_REQUIRED,
  type ContactAddBlockCode,
} from './billing-band-upgrade.constants';
import { BillingManagedContactsService } from './billing-managed-contacts.service';
import { BillingSubscriptionResolverService, SubscriptionRow } from './billing-subscription-resolver.service';
import {
  BillingBand,
  BillingBandZone,
  compareBillingBands,
  formatBillingBandLabel,
  getBandContactCeiling,
  nextBillingBandUp,
  parseBillingBand,
  resolveBillingBandZone,
  resolveRequiredBillingBandFromContactCount,
  resolveSubscriptionPriceEur,
  SubscriptionBundleKey,
  SubscriptionModuleKey,
} from './billing-subscription-pricing';

export type ContactCapacityAssessment = {
  allowed: boolean;
  block_code: ContactAddBlockCode | null;
  block_message: string | null;
  projected_managed_contact_count: number;
  target_upgrade_band: BillingBand | null;
};

export type SubscriptionBandStatus = {
  tenant_id: string;
  managed_contact_count: number;
  contracted_billing_band: BillingBand;
  contact_limit_band: BillingBand;
  required_billing_band: BillingBand;
  band_contact_ceiling: number | null;
  contacts_remaining: number | null;
  utilization_percent: number | null;
  zone: BillingBandZone;
  subscription_bundle: SubscriptionBundleKey | null;
  enabled_modules: SubscriptionModuleKey[];
  current_subscription_eur: number;
  preview_band: BillingBand | null;
  preview_subscription_eur: number | null;
  upgrade_required: boolean;
  enterprise_sales_required: boolean;
  pending_billing_band: BillingBand | null;
  band_upgrade_accepted_at: string | null;
  band_effective_from: string | null;
  enterprise_contract_active: boolean;
  contacts_add_blocked: boolean;
  contacts_add_block_code: ContactAddBlockCode | null;
  upgrade_consent_available: boolean;
  target_upgrade_band: BillingBand | null;
  message: string | null;
};

@Injectable()
export class BillingSubscriptionBandService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly managedContactsService: BillingManagedContactsService,
    private readonly subscriptionResolver: BillingSubscriptionResolverService,
  ) {}

  private async emitAudit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
        eventType,
        JSON.stringify(payload),
      ]);
    } catch {
      // Audit is best-effort for billing consent events.
    }
  }

  private buildPreviewPrice(
    band: BillingBand,
    subscriptionBundle: SubscriptionBundleKey | null,
    enabledModules: SubscriptionModuleKey[],
  ): number | null {
    if (band === 'enterprise') {
      return null;
    }
    return resolveSubscriptionPriceEur({
      billingBand: band,
      subscriptionBundle,
      enabledModules,
    }).amount_eur;
  }

  private mapModules(raw: string[]): SubscriptionModuleKey[] {
    return raw.length > 0 ? (raw as SubscriptionModuleKey[]) : ['foundation', 'eudr'];
  }

  private buildMessage(input: {
    zone: BillingBandZone;
    managedContactCount: number;
    contactLimitBand: BillingBand;
    contractedBand: BillingBand;
    requiredBand: BillingBand;
    ceiling: number | null;
    previewBand: BillingBand | null;
    previewSubscriptionEur: number | null;
    currentSubscriptionEur: number;
    pendingBand: BillingBand | null;
    bandEffectiveFrom: string | null;
  }): string | null {
    const limitLabel = formatBillingBandLabel(input.contactLimitBand);
    const contractedLabel = formatBillingBandLabel(input.contractedBand);

    if (input.pendingBand && input.bandEffectiveFrom) {
      const effectiveDate = new Date(input.bandEffectiveFrom).toLocaleDateString();
      return `Upgrade to ${formatBillingBandLabel(input.pendingBand)} accepted. Subscription billing updates on ${effectiveDate}; you can add contacts up to your new band limit now.`;
    }

    if (input.zone === 'enterprise') {
      return `You have ${input.managedContactCount.toLocaleString()} managed contacts. Networks above 3,000 require an Enterprise plan — contact sales for custom pricing.`;
    }

    if (input.zone === 'red') {
      if (compareBillingBands(input.requiredBand, input.contactLimitBand) > 0) {
        const requiredLabel = formatBillingBandLabel(input.requiredBand);
        const priceHint =
          input.previewSubscriptionEur != null
            ? ` (€${input.previewSubscriptionEur.toFixed(2)}/mo from next month)`
            : '';
        return `Adding contacts requires ${requiredLabel}${priceHint}. Accept the band upgrade to continue.`;
      }
      if (input.ceiling != null) {
        return `You have ${input.managedContactCount} managed contacts but your ${limitLabel} plan covers up to ${input.ceiling}. Upgrade your subscription band to continue growing your roster.`;
      }
    }

    if (input.zone === 'amber' && input.ceiling != null) {
      const remaining = Math.max(0, input.ceiling - input.managedContactCount);
      const previewLabel =
        input.previewBand != null ? formatBillingBandLabel(input.previewBand) : 'the next band';
      const priceHint =
        input.previewSubscriptionEur != null
          ? ` (€${input.previewSubscriptionEur.toFixed(2)}/mo vs €${input.currentSubscriptionEur.toFixed(2)}/mo today)`
          : '';
      return `You are using ${input.managedContactCount} of ${input.ceiling} contacts on ${contractedLabel} (${remaining} remaining). Consider upgrading to ${previewLabel}${priceHint} before you reach the limit.`;
    }

    return null;
  }

  async assessContactCapacity(
    tenantId: string,
    additionalContacts = 1,
  ): Promise<ContactCapacityAssessment> {
    await this.subscriptionResolver.applyScheduledBandUpgrades(tenantId);
    const managedContactCount = await this.managedContactsService.countManagedContacts(tenantId);
    const projectedCount = managedContactCount + Math.max(1, additionalContacts);
    const requiredBand = resolveRequiredBillingBandFromContactCount(projectedCount);
    const row = await this.subscriptionResolver.getSubscriptionRow(tenantId);
    const contactLimitBand = row
      ? this.subscriptionResolver.resolveContactLimitBand(row)
      : 'starter';

    if (requiredBand === 'enterprise' && row?.enterprise_contract_active !== true) {
      return {
        allowed: false,
        block_code: ENTERPRISE_SALES_REQUIRED,
        block_message:
          'Your roster exceeds 3,000 managed contacts. Contact sales to enable Enterprise before adding more contacts.',
        projected_managed_contact_count: projectedCount,
        target_upgrade_band: null,
      };
    }

    if (compareBillingBands(requiredBand, contactLimitBand) > 0) {
      return {
        allowed: false,
        block_code: BILLING_BAND_UPGRADE_REQUIRED,
        block_message: `Adding ${additionalContacts} contact(s) requires the ${formatBillingBandLabel(requiredBand)} band. Accept the upgrade to continue.`,
        projected_managed_contact_count: projectedCount,
        target_upgrade_band: requiredBand === 'enterprise' ? null : requiredBand,
      };
    }

    return {
      allowed: true,
      block_code: null,
      block_message: null,
      projected_managed_contact_count: projectedCount,
      target_upgrade_band: null,
    };
  }

  async assertCanAddContacts(tenantId: string, additionalContacts = 1): Promise<void> {
    const assessment = await this.assessContactCapacity(tenantId, additionalContacts);
    if (!assessment.allowed) {
      throw new ForbiddenException({
        code: assessment.block_code,
        message: assessment.block_message,
        target_upgrade_band: assessment.target_upgrade_band,
        projected_managed_contact_count: assessment.projected_managed_contact_count,
      });
    }
  }

  async acceptBandUpgrade(tenantId: string, targetBandInput?: string): Promise<SubscriptionBandStatus> {
    await this.subscriptionResolver.applyScheduledBandUpgrades(tenantId);
    const managedContactCount = await this.managedContactsService.countManagedContacts(tenantId);
    const row = await this.subscriptionResolver.getSubscriptionRow(tenantId);
    const contactLimitBand = row
      ? this.subscriptionResolver.resolveContactLimitBand(row)
      : 'starter';
    const requiredForNextAdd = resolveRequiredBillingBandFromContactCount(managedContactCount + 1);
    const suggestedTarget =
      compareBillingBands(requiredForNextAdd, contactLimitBand) > 0
        ? requiredForNextAdd
        : nextBillingBandUp(contactLimitBand);
    const parsedTarget = targetBandInput ? parseBillingBand(targetBandInput) : null;
    const targetBand = parsedTarget ?? suggestedTarget;

    if (!targetBand || targetBand === 'enterprise') {
      throw new BadRequestException(
        'Enterprise upgrades require sales onboarding. Contact hello@tracebud.com.',
      );
    }

    if (compareBillingBands(targetBand, contactLimitBand) <= 0) {
      throw new BadRequestException('Your subscription band already covers this contact volume.');
    }

    await this.subscriptionResolver.acceptBandUpgrade(tenantId, targetBand);
    await this.emitAudit('billing_band_upgrade_accepted', {
      tenantId,
      targetBand,
      projectedManagedContactCount: managedContactCount + 1,
    });

    return this.getSubscriptionBandStatus(tenantId);
  }

  async getSubscriptionBandStatus(tenantId: string): Promise<SubscriptionBandStatus> {
    await this.subscriptionResolver.applyScheduledBandUpgrades(tenantId);
    const managedContactCount = await this.managedContactsService.countManagedContacts(tenantId);
    const requiredBillingBand = resolveRequiredBillingBandFromContactCount(managedContactCount);
    const row = await this.subscriptionResolver.getSubscriptionRow(tenantId);
    const subscriptionBreakdown =
      await this.subscriptionResolver.resolveMonthlySubscriptionEur(tenantId);

    const contractedBillingBand = row?.billing_band ?? subscriptionBreakdown.billing_band;
    const contactLimitBand = row
      ? this.subscriptionResolver.resolveContactLimitBand(row)
      : contractedBillingBand;
    const subscriptionBundle = subscriptionBreakdown.subscription_bundle;
    const enabledModules = this.mapModules(
      row?.enabled_modules ?? subscriptionBreakdown.enabled_modules,
    );
    const bandContactCeiling = getBandContactCeiling(contactLimitBand);
    const zone = resolveBillingBandZone({
      managedContactCount,
      contractedBand: contactLimitBand,
      requiredBand: requiredBillingBand,
    });

    const upgradeRequired = compareBillingBands(requiredBillingBand, contactLimitBand) > 0;
    const enterpriseSalesRequired =
      requiredBillingBand === 'enterprise' && row?.enterprise_contract_active !== true;

    let previewBand: BillingBand | null = null;
    if (upgradeRequired && requiredBillingBand !== 'enterprise') {
      previewBand = requiredBillingBand;
    } else if (zone === 'amber') {
      previewBand = nextBillingBandUp(contactLimitBand);
    }

    const previewSubscriptionEur =
      previewBand != null
        ? this.buildPreviewPrice(previewBand, subscriptionBundle, enabledModules)
        : null;

    const contactsRemaining =
      bandContactCeiling != null ? Math.max(0, bandContactCeiling - managedContactCount) : null;
    const utilizationPercent =
      bandContactCeiling != null && bandContactCeiling > 0
        ? Math.min(100, Math.round((managedContactCount / bandContactCeiling) * 100))
        : null;

    const capacity = await this.assessContactCapacity(tenantId, 1);
    const upgradeConsentAvailable =
      !capacity.allowed &&
      capacity.block_code === BILLING_BAND_UPGRADE_REQUIRED &&
      capacity.target_upgrade_band != null;

    const message = this.buildMessage({
      zone,
      managedContactCount,
      contactLimitBand,
      contractedBand: contractedBillingBand,
      requiredBand: requiredBillingBand,
      ceiling: bandContactCeiling,
      previewBand,
      previewSubscriptionEur,
      currentSubscriptionEur: subscriptionBreakdown.amount_eur,
      pendingBand: row?.pending_billing_band ?? null,
      bandEffectiveFrom: row?.band_effective_from ?? null,
    });

    return {
      tenant_id: tenantId,
      managed_contact_count: managedContactCount,
      contracted_billing_band: contractedBillingBand,
      contact_limit_band: contactLimitBand,
      required_billing_band: requiredBillingBand,
      band_contact_ceiling: bandContactCeiling,
      contacts_remaining: contactsRemaining,
      utilization_percent: utilizationPercent,
      zone,
      subscription_bundle: subscriptionBundle,
      enabled_modules: enabledModules,
      current_subscription_eur: subscriptionBreakdown.amount_eur,
      preview_band: previewBand,
      preview_subscription_eur: previewSubscriptionEur,
      upgrade_required: upgradeRequired,
      enterprise_sales_required: enterpriseSalesRequired,
      pending_billing_band: row?.pending_billing_band ?? null,
      band_upgrade_accepted_at: row?.band_upgrade_accepted_at ?? null,
      band_effective_from: row?.band_effective_from ?? null,
      enterprise_contract_active: row?.enterprise_contract_active ?? false,
      contacts_add_blocked: !capacity.allowed,
      contacts_add_block_code: capacity.block_code,
      upgrade_consent_available: upgradeConsentAvailable,
      target_upgrade_band: capacity.target_upgrade_band,
      message,
    };
  }
}
