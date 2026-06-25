'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TracebudLogo } from '@/components/brand/tracebud-logo';
import {
  buildDashboardClaimUrl,
  buildDashboardLoginUrlForClaim,
  buildDashboardSignupUrlForClaim,
  type DeliveryTripPublicPreview,
} from '@/lib/delivery-intake-qr';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';
import { cn } from '@/lib/utils';

type DeliveryTripPreviewPageProps = {
  params: Promise<{ ref: string }>;
};

const STEPS = [
  { step: '1', title: 'Scan trip QR', body: 'You opened the multi-plot delivery link.' },
  { step: '2', title: 'Sign in', body: 'Use your cooperative or buyer workspace.' },
  { step: '3', title: 'Confirm at desk', body: 'Register weight and assemble your batch.' },
] as const;

export default function DeliveryTripPreviewPage({ params }: DeliveryTripPreviewPageProps) {
  const [tripRef, setTripRef] = useState<string | null>(null);
  const [preview, setPreview] = useState<DeliveryTripPublicPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void params.then(async ({ ref }) => {
      const code = ref.trim();
      setTripRef(code);
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/harvest/delivery-trip-preview/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryTripPublicPreview };
        if (!response.ok || !body.preview) {
          if (!cancelled) setError('This delivery trip was not found or is no longer available.');
          return;
        }
        if (!cancelled) {
          setPreview(body.preview);
          trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_QR_PREVIEW_VIEWED, { qrRef: body.preview.tripRef });
        }
      } catch {
        if (!cancelled) setError('Could not load this delivery trip. Try again in a moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const claimHref = preview ? buildDashboardClaimUrl(preview.tripRef) : '/harvests';
  const readyCount = preview?.lines.filter((line) => line.eligibleForBuyerIntake).length ?? 0;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <TracebudLogo size="xs" />
          <div>
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-lg font-semibold">Delivery trip</h1>
            </div>
            <p className="text-xs text-muted-foreground">Multi-plot truck visit</p>
          </div>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading trip…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <p className="text-2xl font-semibold">{preview.totalKg.toLocaleString()} kg</p>
              <p className="mt-1 text-muted-foreground">
                {preview.lineCount} plot(s) · {readyCount} ready for registration
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{preview.tripRef}</p>
            </div>

            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {preview.lines.map((line) => (
                <li
                  key={line.qrRef}
                  className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{line.plotName ?? 'Plot'}</p>
                    <p className="text-muted-foreground">{(line.kg ?? 0).toLocaleString()} kg</p>
                    <p className="font-mono text-xs text-muted-foreground">{line.qrRef}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0',
                      line.eligibleForBuyerIntake
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800',
                    )}
                  >
                    {line.eligibleForBuyerIntake ? 'Ready' : 'Pending'}
                  </Badge>
                </li>
              ))}
            </ul>

            <ol className="space-y-3 border-t border-border pt-4">
              {STEPS.map((item) => (
                <li key={item.step} className="flex gap-3 text-sm">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href={claimHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Package className="h-4 w-4" />
              Sign in to register trip
            </Link>
            <div className="flex flex-col gap-2 text-center text-sm">
              <Link
                href={buildDashboardSignupUrlForClaim(preview.tripRef)}
                className="font-medium text-primary hover:underline"
              >
                Create a workspace to claim this trip
              </Link>
              <Link
                href={buildDashboardLoginUrlForClaim(preview.tripRef)}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Trip {tripRef ?? ''} unavailable.</p>
        )}
      </div>
    </main>
  );
}
