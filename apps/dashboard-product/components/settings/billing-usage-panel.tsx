'use client';

import { useEffect, useState } from 'react';
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

export function BillingUsagePanel() {
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
          setError('Billing usage is not available yet. Run backend migrations if this is a new environment.');
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load billing usage.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {promo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Adoption offer</CardTitle>
            <CardDescription>
              Your first sealed shipment or first DDS submit is free (€1 each). If you use either free
              shipment leg, the 3-month subscription-free offer ends that month — subscription billing
              starts the following month. Otherwise you keep 3 months subscription-free until you ship.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">
                {promo.subscription_promo_forfeited
                  ? 'Subscription billing starts'
                  : 'Subscription free until'}
              </p>
              <p className="font-medium">
                {promo.subscription_promo_forfeited && promo.subscription_billing_starts_at
                  ? new Date(promo.subscription_billing_starts_at).toLocaleDateString()
                  : promo.subscription_free_active
                    ? new Date(promo.subscription_free_until).toLocaleDateString()
                    : 'Ended'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">First origin seal</p>
              <Badge variant={promo.first_origin_seal_available ? 'secondary' : 'outline'}>
                {promo.first_origin_seal_available ? 'Free — available' : 'Used'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">First DDS submit</p>
              <Badge variant={promo.first_destination_submit_available ? 'secondary' : 'outline'}>
                {promo.first_destination_submit_available ? 'Free — available' : 'Used'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subscription band</CardTitle>
          <CardDescription>
            Your monthly price depends on managed contacts (Starter 1–50, Growth 51–500, Scale 501–3,000,
            Enterprise 3,001+).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionBandSummary
            status={bandStatus}
            onRequestUpgrade={() => setUpgradeModalOpen(true)}
          />
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
          <CardTitle>Monthly billing preview</CardTitle>
          <CardDescription>
            Subscription plus metered usage (€1 per origin seal, €1 per destination DDS submit) is invoiced at
            month end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : !summary ? (
            <p className="text-sm text-muted-foreground">Loading billing preview…</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Billing period</span>
                <Badge variant="outline">{summary.billing_period}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Origin seals (€1 each)</p>
                  <p className="text-lg font-semibold">
                    {summary.origin_seal_count} · €{summary.origin_seal_amount_eur.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Destination DDS submits (€1 each)</p>
                  <p className="text-lg font-semibold">
                    {summary.destination_submit_count} · €{summary.destination_submit_amount_eur.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Subscription (this period)</span>
                  <span>€{summary.subscription_amount_eur.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between font-medium">
                  <span>Projected month-end total</span>
                  <span>€{summary.projected_invoice_total_eur.toFixed(2)}</span>
                </div>
                {summary.invoice_status && (
                  <p className="mt-2 text-xs text-muted-foreground">Invoice status: {summary.invoice_status}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent metered events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metered events this period yet.</p>
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
