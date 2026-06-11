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

export async function fetchAdoptionPromo(): Promise<AdoptionPromoStatus | null> {
  const response = await fetch('/api/billing/adoption-promo', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { promo?: AdoptionPromoStatus | null };
  return body.promo ?? null;
}

export type BillingUsageMeter = {
  id: string;
  event_type: string;
  amount_eur: number;
  reference_type: string;
  reference_id: string;
  shipment_header_id: string | null;
  billing_period: string;
  occurred_at: string;
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function fetchBillingUsageSummary(period?: string): Promise<BillingUsageSummary | null> {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  const response = await fetch(`/api/billing/usage-summary${query}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as BillingUsageSummary;
}

export type BillingBandZone = 'green' | 'amber' | 'red' | 'enterprise';

export type SubscriptionBandStatus = {
  tenant_id: string;
  managed_contact_count: number;
  contracted_billing_band: 'starter' | 'growth' | 'scale' | 'enterprise';
  contact_limit_band: 'starter' | 'growth' | 'scale' | 'enterprise';
  required_billing_band: 'starter' | 'growth' | 'scale' | 'enterprise';
  band_contact_ceiling: number | null;
  contacts_remaining: number | null;
  utilization_percent: number | null;
  zone: BillingBandZone;
  subscription_bundle: string | null;
  enabled_modules: string[];
  current_subscription_eur: number;
  preview_band: 'starter' | 'growth' | 'scale' | 'enterprise' | null;
  preview_subscription_eur: number | null;
  upgrade_required: boolean;
  enterprise_sales_required: boolean;
  pending_billing_band: 'starter' | 'growth' | 'scale' | 'enterprise' | null;
  band_upgrade_accepted_at: string | null;
  band_effective_from: string | null;
  enterprise_contract_active: boolean;
  contacts_add_blocked: boolean;
  contacts_add_block_code: 'BILLING_BAND_UPGRADE_REQUIRED' | 'ENTERPRISE_SALES_REQUIRED' | null;
  upgrade_consent_available: boolean;
  target_upgrade_band: 'starter' | 'growth' | 'scale' | 'enterprise' | null;
  message: string | null;
};

export type ContactCapacityAssessment = {
  allowed: boolean;
  block_code: 'BILLING_BAND_UPGRADE_REQUIRED' | 'ENTERPRISE_SALES_REQUIRED' | null;
  block_message: string | null;
  projected_managed_contact_count: number;
  target_upgrade_band: 'starter' | 'growth' | 'scale' | 'enterprise' | null;
};

export async function assessContactCapacity(
  additionalContacts = 1,
): Promise<ContactCapacityAssessment | null> {
  const response = await fetch('/api/billing/assess-contact-capacity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ additionalContacts }),
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { assessment?: ContactCapacityAssessment };
  return body.assessment ?? null;
}

export async function acceptBandUpgrade(targetBand?: string): Promise<SubscriptionBandStatus | null> {
  const response = await fetch('/api/billing/accept-band-upgrade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(targetBand ? { targetBand } : {}),
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.message?.message === 'string'
          ? payload.message.message
          : 'Failed to accept band upgrade.';
    throw new Error(message);
  }
  const body = (await response.json()) as { status?: SubscriptionBandStatus };
  return body.status ?? null;
}

export async function fetchSubscriptionBandStatus(): Promise<SubscriptionBandStatus | null> {
  const response = await fetch('/api/billing/subscription-band', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { status?: SubscriptionBandStatus | null };
  return body.status ?? null;
}

export async function fetchBillingEvents(period?: string): Promise<BillingUsageMeter[]> {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  const response = await fetch(`/api/billing/events${query}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { items?: BillingUsageMeter[] };
  return Array.isArray(body.items) ? body.items : [];
}
