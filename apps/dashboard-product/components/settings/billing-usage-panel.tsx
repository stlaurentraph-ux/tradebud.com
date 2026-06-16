'use client';

import { useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionBandSummary } from '@/components/billing/subscription-band-banner';
import { UpgradeBandConsentModal } from '@/components/billing/upgrade-band-consent-modal';
import {
  fetchAdoptionPromo,
  fetchBillingEvents,
  fetchBillingUsageSummary,
  fetchSubscriptionBandStatus,
  type AdoptionPromoStatus,
  type BillingUsageMeter,
  type BillingUsageSummary,
  type SubscriptionBandStatus,
} from '@/lib/billing-client';
import { LocaleContext } from '@/lib/locale-context';
import { getSettingsCopy } from '@/lib/workflow-terminology-labels';

export function BillingUsagePanel() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [summary, setSummary] = useState<BillingUsageSummary | null>(null);
  const [promo, setPromo] = useState<AdoptionPromoStatus | null>(null);
  const [events, setEvents] = useState<BillingUsageMeter[]>([]);
  const [bandStatus, setBandStatus] = useState<SubscriptionBandStatus | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchBillingUsageSummary(),
      fetchBillingEvents(),
      fetchAdoptionPromo(),
      fetchSubscriptionBandStatus(),
    ])
      .then(([usageSummary, usageEvents, adoptionPromo, subscriptionBand]) => {
        if (cancelled) return;
        setSummary(usageSummary);
        setPromo(adoptionPromo ?? usageSummary?.adoption_promo ?? null);
        setEvents(usageEvents);
        setBandStatus(subscriptionBand);
        if (!usageSummary) {
          setError(getSettingsCopy('billing_error_unavailable', t));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : getSettingsCopy('billing_error_load', t),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="space-y-6">
      {promo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{getSettingsCopy('billing_adoption_title', t)}</CardTitle>
            <CardDescription>{getSettingsCopy('billing_adoption_description', t)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">
                {promo.subscription_promo_forfeited
                  ? getSettingsCopy('billing_subscription_starts', t)
                  : getSettingsCopy('billing_subscription_free_until', t)}
              </p>
              <p className="font-medium">
                {promo.subscription_promo_forfeited && promo.subscription_billing_starts_at
                  ? new Date(promo.subscription_billing_starts_at).toLocaleDateString()
                  : promo.subscription_free_active
                    ? new Date(promo.subscription_free_until).toLocaleDateString()
                    : getSettingsCopy('billing_ended', t)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{getSettingsCopy('billing_first_origin_seal', t)}</p>
              <Badge variant={promo.first_origin_seal_available ? 'secondary' : 'outline'}>
                {promo.first_origin_seal_available
                  ? getSettingsCopy('billing_free_available', t)
                  : getSettingsCopy('billing_used', t)}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{getSettingsCopy('billing_first_dds_submit', t)}</p>
              <Badge variant={promo.first_destination_submit_available ? 'secondary' : 'outline'}>
                {promo.first_destination_submit_available
                  ? getSettingsCopy('billing_free_available', t)
                  : getSettingsCopy('billing_used', t)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{getSettingsCopy('billing_band_title', t)}</CardTitle>
          <CardDescription>{getSettingsCopy('billing_band_description', t)}</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionBandSummary status={bandStatus} onRequestUpgrade={() => setUpgradeModalOpen(true)} />
        </CardContent>
      </Card>

      <UpgradeBandConsentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        status={bandStatus}
        onAccepted={setBandStatus}
      />

      <Card>
        <CardHeader>
          <CardTitle>{getSettingsCopy('billing_preview_title', t)}</CardTitle>
          <CardDescription>{getSettingsCopy('billing_preview_description', t)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : !summary ? (
            <p className="text-sm text-muted-foreground">{getSettingsCopy('billing_loading_preview', t)}</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{getSettingsCopy('billing_period', t)}</span>
                <Badge variant="outline">{summary.billing_period}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{getSettingsCopy('billing_origin_seals', t)}</p>
                  <p className="text-lg font-semibold">
                    {summary.origin_seal_count} · €{summary.origin_seal_amount_eur.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {getSettingsCopy('billing_destination_submits', t)}
                  </p>
                  <p className="text-lg font-semibold">
                    {summary.destination_submit_count} · €{summary.destination_submit_amount_eur.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex justify-between">
                  <span>{getSettingsCopy('billing_subscription_period', t)}</span>
                  <span>€{summary.subscription_amount_eur.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between font-medium">
                  <span>{getSettingsCopy('billing_projected_total', t)}</span>
                  <span>€{summary.projected_invoice_total_eur.toFixed(2)}</span>
                </div>
                {summary.invoice_status && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {getSettingsCopy('billing_invoice_status', t, { status: summary.invoice_status })}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{getSettingsCopy('billing_recent_events', t)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">{getSettingsCopy('billing_no_events', t)}</p>
          ) : (
            events.slice(0, 20).map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{event.event_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.reference_type} · {new Date(event.occurred_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">€{event.amount_eur.toFixed(2)}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
