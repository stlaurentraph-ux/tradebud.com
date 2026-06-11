export type BillingBand = 'starter' | 'growth' | 'scale' | 'enterprise';

export type SubscriptionBundleKey =
  | 'compliance_starter'
  | 'climate_starter'
  | 'sustainability_bundle'
  | 'due_diligence_bundle'
  | 'open_chain_bundle';

export type SubscriptionModuleKey =
  | 'foundation'
  | 'eudr'
  | 'esg_carbon'
  | 'regenerative_ag'
  | 'child_labor'
  | 'open_chain';

export const BUNDLE_MODULE_INCLUDES: Record<SubscriptionBundleKey, SubscriptionModuleKey[]> = {
  compliance_starter: ['foundation', 'eudr'],
  climate_starter: ['foundation', 'esg_carbon'],
  sustainability_bundle: ['foundation', 'esg_carbon', 'regenerative_ag'],
  due_diligence_bundle: ['foundation', 'eudr', 'child_labor'],
  open_chain_bundle: ['foundation', 'eudr', 'esg_carbon', 'open_chain'],
};

const MODULE_PRICES: Record<SubscriptionModuleKey, Record<Exclude<BillingBand, 'enterprise'>, number>> =
  {
    foundation: { starter: 10, growth: 15, scale: 20 },
    eudr: { starter: 20, growth: 30, scale: 50 },
    esg_carbon: { starter: 10, growth: 20, scale: 30 },
    regenerative_ag: { starter: 10, growth: 15, scale: 20 },
    child_labor: { starter: 10, growth: 15, scale: 25 },
    open_chain: { starter: 20, growth: 40, scale: 70 },
  };

const BUNDLE_PRICES: Record<
  SubscriptionBundleKey,
  Record<Exclude<BillingBand, 'enterprise'>, number>
> = {
  compliance_starter: { starter: 20, growth: 40, scale: 60 },
  climate_starter: { starter: 15, growth: 25, scale: 45 },
  sustainability_bundle: { starter: 20, growth: 35, scale: 60 },
  due_diligence_bundle: { starter: 30, growth: 50, scale: 85 },
  open_chain_bundle: { starter: 50, growth: 85, scale: 150 },
};

export type SubscriptionPriceBreakdown = {
  billing_band: BillingBand;
  subscription_bundle: SubscriptionBundleKey | null;
  enabled_modules: SubscriptionModuleKey[];
  amount_eur: number;
  pricing_source: 'bundle' | 'modules' | 'enterprise_custom' | 'none';
};

export function resolveModuleListPriceEur(
  modules: SubscriptionModuleKey[],
  band: Exclude<BillingBand, 'enterprise'>,
): number {
  const unique = [...new Set(modules)];
  return unique.reduce((sum, moduleKey) => sum + (MODULE_PRICES[moduleKey]?.[band] ?? 0), 0);
}

export function resolveSubscriptionPriceEur(input: {
  billingBand: BillingBand;
  subscriptionBundle: SubscriptionBundleKey | null;
  enabledModules: SubscriptionModuleKey[];
}): SubscriptionPriceBreakdown {
  if (input.billingBand === 'enterprise') {
    return {
      billing_band: 'enterprise',
      subscription_bundle: input.subscriptionBundle,
      enabled_modules: input.enabledModules,
      amount_eur: 0,
      pricing_source: 'enterprise_custom',
    };
  }

  if (input.subscriptionBundle) {
    return {
      billing_band: input.billingBand,
      subscription_bundle: input.subscriptionBundle,
      enabled_modules: BUNDLE_MODULE_INCLUDES[input.subscriptionBundle],
      amount_eur: BUNDLE_PRICES[input.subscriptionBundle][input.billingBand],
      pricing_source: 'bundle',
    };
  }

  const modules: SubscriptionModuleKey[] =
    input.enabledModules.length > 0 ? input.enabledModules : ['foundation', 'eudr'];
  return {
    billing_band: input.billingBand,
    subscription_bundle: null,
    enabled_modules: [...modules],
    amount_eur: resolveModuleListPriceEur(modules, input.billingBand),
    pricing_source: 'modules',
  };
}

export function inferBillingBandFromTeamSize(teamSize: string | null | undefined): BillingBand {
  const normalized = teamSize?.trim().toLowerCase() ?? '';
  if (!normalized) {
    return 'starter';
  }
  if (normalized.includes('3001') || normalized.includes('enterprise')) {
    return 'enterprise';
  }
  if (
    normalized.includes('501') ||
    normalized.includes('500-') ||
    normalized.includes('1000') ||
    normalized.includes('3000')
  ) {
    return 'scale';
  }
  if (
    normalized.includes('51') ||
    normalized.includes('100-') ||
    normalized.includes('200-') ||
    normalized.includes('500')
  ) {
    return 'growth';
  }
  return 'starter';
}

export function parseSubscriptionModuleKey(value: string): SubscriptionModuleKey | null {
  const normalized = value.trim().toLowerCase().replace(/-/g, '_');
  const allowed: SubscriptionModuleKey[] = [
    'foundation',
    'eudr',
    'esg_carbon',
    'regenerative_ag',
    'child_labor',
    'open_chain',
  ];
  return allowed.includes(normalized as SubscriptionModuleKey)
    ? (normalized as SubscriptionModuleKey)
    : null;
}

export const BAND_CONTACT_CEILINGS: Record<Exclude<BillingBand, 'enterprise'>, number> = {
  starter: 50,
  growth: 500,
  scale: 3000,
};

export const MANAGED_CONTACT_ACTIVE_STATUSES = [
  'new',
  'invited',
  'engaged',
  'submitted',
] as const;

export type BillingBandZone = 'green' | 'amber' | 'red' | 'enterprise';

export function resolveRequiredBillingBandFromContactCount(count: number): BillingBand {
  if (count >= 3001) {
    return 'enterprise';
  }
  if (count >= 501) {
    return 'scale';
  }
  if (count >= 51) {
    return 'growth';
  }
  return 'starter';
}

export function getBandContactCeiling(band: BillingBand): number | null {
  if (band === 'enterprise') {
    return null;
  }
  return BAND_CONTACT_CEILINGS[band];
}

export function nextBillingBandUp(band: BillingBand): BillingBand | null {
  if (band === 'starter') {
    return 'growth';
  }
  if (band === 'growth') {
    return 'scale';
  }
  if (band === 'scale') {
    return 'enterprise';
  }
  return null;
}

export function compareBillingBands(left: BillingBand, right: BillingBand): number {
  const order: BillingBand[] = ['starter', 'growth', 'scale', 'enterprise'];
  return order.indexOf(left) - order.indexOf(right);
}

export function resolveBillingBandZone(input: {
  managedContactCount: number;
  contractedBand: BillingBand;
  requiredBand: BillingBand;
}): BillingBandZone {
  if (input.requiredBand === 'enterprise') {
    return 'enterprise';
  }
  if (compareBillingBands(input.requiredBand, input.contractedBand) > 0) {
    return 'red';
  }
  const ceiling = getBandContactCeiling(input.contractedBand);
  if (ceiling != null && input.managedContactCount > ceiling) {
    return 'red';
  }
  if (ceiling != null && input.managedContactCount >= Math.ceil(ceiling * 0.8)) {
    return 'amber';
  }
  return 'green';
}

export function formatBillingBandLabel(band: BillingBand): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

export function parseBillingBand(value: string | null | undefined): BillingBand | null {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === 'starter' ||
    normalized === 'growth' ||
    normalized === 'scale' ||
    normalized === 'enterprise'
  ) {
    return normalized;
  }
  return null;
}

export function parseSubscriptionBundleKey(value: string): SubscriptionBundleKey | null {
  const normalized = value.trim().toLowerCase().replace(/-/g, '_');
  const allowed = Object.keys(BUNDLE_PRICES) as SubscriptionBundleKey[];
  return allowed.includes(normalized as SubscriptionBundleKey)
    ? (normalized as SubscriptionBundleKey)
    : null;
}
