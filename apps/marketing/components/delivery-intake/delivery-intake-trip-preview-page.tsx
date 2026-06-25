'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Package, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeliveryIntakeSteps } from '@/components/delivery-intake/delivery-intake-preview-chrome';
import { DeliveryIntakeQrImage } from '@/components/delivery-intake/delivery-intake-qr-image';
import { DeliveryIntakeTrackedLink } from '@/components/delivery-intake/delivery-intake-tracked-link';
import {
  buildDashboardClaimUrl,
  buildDashboardLoginUrlForClaim,
  buildDashboardSignupUrlForClaim,
  buildMarketingDeliveryTripQrUrl,
} from '@/lib/delivery-intake-links';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { cn } from '@/lib/utils';

type DeliveryTripPreview = {
  tripRef: string;
  lineCount: number;
  totalKg: number;
  directedToBuyer: boolean;
  createdAt: string;
  lines: Array<{
    qrRef: string;
    plotName: string | null;
    kg: number | null;
    eligibleForBuyerIntake: boolean;
  }>;
};

export function DeliveryIntakeTripPreviewPage({ refCode }: { refCode: string }) {
  const [preview, setPreview] = useState<DeliveryTripPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const code = refCode.trim();

    void (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`/api/delivery-trip-preview/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryTripPreview };
        if (!response.ok || !body.preview) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!cancelled) {
          setPreview(body.preview);
          const readyCount = body.preview.lines.filter((line) => line.eligibleForBuyerIntake).length;
          trackMarketingEvent('delivery_qr_preview_viewed', {
            qrRef: body.preview.tripRef,
            intakeKind: 'trip',
            lineCount: body.preview.lineCount,
            readyCount,
            directedToBuyer: body.preview.directedToBuyer,
          });
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refCode]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading delivery trip…
        </p>
      </main>
    );
  }

  if (notFound || !preview) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <p className="text-center text-sm text-muted-foreground">
          This delivery trip was not found or is no longer available.
        </p>
      </main>
    );
  }

  const readyCount = preview.lines.filter((line) => line.eligibleForBuyerIntake).length;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={36}
            height={36}
            className="rounded-md"
          />
          <div>
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-lg font-semibold text-foreground">Delivery trip</h1>
            </div>
            <p className="text-xs text-muted-foreground">Multi-plot truck visit</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <DeliveryIntakeQrImage
            value={buildMarketingDeliveryTripQrUrl(preview.tripRef)}
            alt={`QR code for trip ${preview.tripRef}`}
          />
          <p className="mt-4 text-2xl font-semibold text-foreground">{preview.totalKg.toLocaleString()} kg</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview.lineCount} plot(s) · {readyCount} ready for registration
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{preview.tripRef}</p>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {preview.lines.map((line) => (
            <li
              key={line.qrRef}
              className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{line.plotName ?? 'Plot'}</p>
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

        <DeliveryIntakeSteps />

        <DeliveryIntakeTrackedLink
          href={buildDashboardClaimUrl(preview.tripRef)}
          cta="claim"
          intakeKind="trip"
          refCode={preview.tripRef}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          Register trip in Tracebud
        </DeliveryIntakeTrackedLink>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <DeliveryIntakeTrackedLink
            href={buildDashboardSignupUrlForClaim(preview.tripRef)}
            cta="signup"
            intakeKind="trip"
            refCode={preview.tripRef}
            className="font-medium text-primary hover:underline"
          >
            Create a workspace to claim this trip
          </DeliveryIntakeTrackedLink>
          <DeliveryIntakeTrackedLink
            href={buildDashboardLoginUrlForClaim(preview.tripRef)}
            cta="login"
            intakeKind="trip"
            refCode={preview.tripRef}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Already have an account? Sign in
          </DeliveryIntakeTrackedLink>
        </div>
      </div>
    </main>
  );
}
