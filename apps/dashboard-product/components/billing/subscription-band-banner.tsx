'use client';

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { SubscriptionBandStatus } from '@/lib/billing-client';
import { AlertTriangle, Building2 } from 'lucide-react';

function formatBandLabel(band: string): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

type SubscriptionBandBannerProps = {
  status: SubscriptionBandStatus | null;
  className?: string;
  onRequestUpgrade?: () => void;
};

export function SubscriptionBandBanner({
  status,
  className,
  onRequestUpgrade,
}: SubscriptionBandBannerProps) {
  if (!status || status.zone === 'green') {
    return null;
  }

  if (status.zone === 'enterprise') {
    return (
      <Alert className={`border-violet-500/50 bg-violet-500/10 ${className ?? ''}`}>
        <Building2 className="h-4 w-4 text-violet-700" />
        <AlertTitle className="text-violet-900">Enterprise plan required</AlertTitle>
        <AlertDescription className="text-violet-900">
          <p>{status.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <a href="mailto:hello@tracebud.com?subject=Tracebud%20Enterprise%20plan">Contact sales</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings?tab=billing">View billing</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const isRed = status.zone === 'red';

  return (
    <Alert
      className={`${
        isRed ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/50 bg-amber-500/10'
      } ${className ?? ''}`}
    >
      <AlertTriangle className={`h-4 w-4 ${isRed ? 'text-red-700' : 'text-amber-700'}`} />
      <AlertTitle className={isRed ? 'text-red-900' : 'text-amber-900'}>
        {isRed ? 'Subscription band upgrade needed' : 'Approaching your contact limit'}
      </AlertTitle>
      <AlertDescription className={isRed ? 'text-red-900' : 'text-amber-900'}>
        <p>{status.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(status.upgrade_consent_available || status.contacts_add_blocked) && onRequestUpgrade ? (
            <Button size="sm" variant="default" onClick={onRequestUpgrade}>
              Accept upgrade
            </Button>
          ) : null}
          {status.zone === 'amber' && onRequestUpgrade && status.preview_band ? (
            <Button size="sm" variant="outline" onClick={onRequestUpgrade}>
              Upgrade to {formatBandLabel(status.preview_band)}
            </Button>
          ) : null}
          <Button asChild size="sm" variant={isRed ? 'outline' : 'outline'}>
            <Link href="/settings?tab=billing">Review billing</Link>
          </Button>
          {status.preview_band && status.preview_subscription_eur != null ? (
            <span className="self-center text-xs">
              {formatBandLabel(status.preview_band)} preview: €{status.preview_subscription_eur.toFixed(2)}/mo
            </span>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}

type SubscriptionBandSummaryProps = {
  status: SubscriptionBandStatus | null;
  onRequestUpgrade?: () => void;
};

export function SubscriptionBandSummary({ status, onRequestUpgrade }: SubscriptionBandSummaryProps) {
  if (!status) {
    return (
      <p className="text-sm text-muted-foreground">Subscription band details are not available yet.</p>
    );
  }

  const bandLabel = formatBandLabel(status.contracted_billing_band);
  const ceilingLabel =
    status.band_contact_ceiling != null
      ? `${status.managed_contact_count} / ${status.band_contact_ceiling} contacts`
      : `${status.managed_contact_count.toLocaleString()} contacts`;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Subscription band</p>
          <p className="text-lg font-semibold">
            {bandLabel} · {ceilingLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Monthly subscription</p>
          <p className="text-lg font-semibold">€{status.current_subscription_eur.toFixed(2)}/mo</p>
        </div>
      </div>
      {status.utilization_percent != null && status.band_contact_ceiling != null ? (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                status.zone === 'red'
                  ? 'bg-red-500'
                  : status.zone === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, status.utilization_percent)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {status.contacts_remaining != null
              ? `${status.contacts_remaining} contacts remaining on ${bandLabel}`
              : `Required band for current roster: ${formatBandLabel(status.required_billing_band)}`}
          </p>
        </div>
      ) : null}
      {status.message && status.zone === 'green' ? (
        <p className="text-xs text-muted-foreground">{status.message}</p>
      ) : null}
      <SubscriptionBandBanner status={status} onRequestUpgrade={onRequestUpgrade} />
    </div>
  );
}
