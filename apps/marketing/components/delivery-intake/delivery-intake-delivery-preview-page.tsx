'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Package, QrCode } from 'lucide-react';
import {
  DeliveryIntakeStatusBadge,
  DeliveryIntakeSteps,
  resolveDeliveryIntakeStatus,
} from '@/components/delivery-intake/delivery-intake-preview-chrome';
import { DeliveryIntakeQrImage } from '@/components/delivery-intake/delivery-intake-qr-image';
import { DeliveryIntakeTrackedLink } from '@/components/delivery-intake/delivery-intake-tracked-link';
import {
  buildDashboardClaimUrl,
  buildDashboardLoginUrlForClaim,
  buildDashboardSignupUrlForClaim,
  buildMarketingDeliveryQrUrl,
} from '@/lib/delivery-intake-links';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type DeliveryPreview = {
  qrRef: string;
  kg: number | null;
  harvestDate: string | null;
  plotName: string | null;
  plotComplianceStatus: string | null;
  eligibleForBuyerIntake: boolean;
  intakeBlockReason: 'plot_not_ready' | 'already_packaged' | null;
  directedToBuyer: boolean;
  createdAt: string;
};

function formatKg(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString()} kg`;
}

export function DeliveryIntakeDeliveryPreviewPage({ refCode }: { refCode: string }) {
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const code = refCode.trim();

    void (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`/api/delivery-preview/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryPreview };
        if (!response.ok || !body.preview) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!cancelled) {
          setPreview(body.preview);
          trackMarketingEvent('delivery_qr_preview_viewed', {
            qrRef: body.preview.qrRef,
            intakeKind: 'delivery',
            eligibleForBuyerIntake: body.preview.eligibleForBuyerIntake,
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
          Loading delivery receipt…
        </p>
      </main>
    );
  }

  if (notFound || !preview) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <p className="text-center text-sm text-muted-foreground">
          This delivery receipt was not found or is no longer available.
        </p>
      </main>
    );
  }

  const status = resolveDeliveryIntakeStatus(preview);

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
              <h1 className="text-lg font-semibold text-foreground">Delivery receipt</h1>
            </div>
            <p className="text-xs text-muted-foreground">Field harvest · buyer registration</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <DeliveryIntakeQrImage
            value={buildMarketingDeliveryQrUrl(preview.qrRef)}
            alt={`QR code for delivery ${preview.qrRef}`}
          />
          <p className="mt-4 text-base font-medium text-foreground">{preview.plotName ?? 'Plot delivery'}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{formatKg(preview.kg)}</p>
          {preview.harvestDate ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Delivery date: {new Date(preview.harvestDate).toLocaleDateString()}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs text-muted-foreground">{preview.qrRef}</p>
          <DeliveryIntakeStatusBadge status={status} />
          {preview.directedToBuyer ? (
            <p className="mt-2 text-xs text-muted-foreground">
              The producer directed this delivery to a buyer on Tracebud.
            </p>
          ) : null}
        </div>

        <DeliveryIntakeSteps />

        <DeliveryIntakeTrackedLink
          href={buildDashboardClaimUrl(preview.qrRef)}
          cta="claim"
          intakeKind="delivery"
          refCode={preview.qrRef}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          Register delivery in Tracebud
        </DeliveryIntakeTrackedLink>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <DeliveryIntakeTrackedLink
            href={buildDashboardSignupUrlForClaim(preview.qrRef)}
            cta="signup"
            intakeKind="delivery"
            refCode={preview.qrRef}
            className="font-medium text-primary hover:underline"
          >
            Create a workspace to claim this delivery
          </DeliveryIntakeTrackedLink>
          <DeliveryIntakeTrackedLink
            href={buildDashboardLoginUrlForClaim(preview.qrRef)}
            cta="login"
            intakeKind="delivery"
            refCode={preview.qrRef}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Already have an account? Sign in
          </DeliveryIntakeTrackedLink>
        </div>
      </div>
    </main>
  );
}
