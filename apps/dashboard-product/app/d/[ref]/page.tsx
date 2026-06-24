'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, QrCode } from 'lucide-react';
import { buildDashboardClaimUrl } from '@/lib/delivery-intake-qr';
import type { DeliveryPublicPreview } from '@/lib/delivery-intake-qr';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

type DeliveryPreviewPageProps = {
  params: Promise<{ ref: string }>;
};

function formatKg(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString()} kg`;
}

function eligibilityLabel(preview: DeliveryPublicPreview): string {
  if (preview.eligibleForBuyerIntake) return 'Ready for buyer registration';
  if (preview.intakeBlockReason === 'already_packaged') return 'Already in a batch';
  return 'Plot verification pending';
}

export default function DeliveryPreviewPage({ params }: DeliveryPreviewPageProps) {
  const [qrRef, setQrRef] = useState<string | null>(null);
  const [preview, setPreview] = useState<DeliveryPublicPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void params.then(async ({ ref }) => {
      const code = ref.trim();
      setQrRef(code);
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/harvest/delivery-preview/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryPublicPreview };
        if (!response.ok || !body.preview) {
          if (!cancelled) setError('This delivery receipt was not found or is no longer available.');
          return;
        }
        if (!cancelled) {
          setPreview(body.preview);
          trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_QR_PREVIEW_VIEWED, { qrRef: body.preview.qrRef });
        }
      } catch {
        if (!cancelled) setError('Could not load this delivery receipt. Try again in a moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const claimHref = preview ? buildDashboardClaimUrl(preview.qrRef) : '/harvests';

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <QrCode className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Tracebud delivery receipt</h1>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading receipt…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <p className="font-medium">{preview.plotName ?? 'Plot delivery'}</p>
              <p className="mt-1 text-muted-foreground">{formatKg(preview.kg)}</p>
              {preview.harvestDate ? (
                <p className="text-muted-foreground">
                  Delivery date: {new Date(preview.harvestDate).toLocaleDateString()}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-xs">{preview.qrRef}</p>
              <p
                className={
                  preview.eligibleForBuyerIntake
                    ? 'mt-3 text-xs font-medium text-emerald-700'
                    : 'mt-3 text-xs font-medium text-amber-700'
                }
              >
                {eligibilityLabel(preview)}
              </p>
              {preview.directedToBuyer ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  The producer directed this delivery to a buyer on Tracebud.
                </p>
              ) : null}
            </div>
            <Link
              href={claimHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Package className="h-4 w-4" />
              Sign in to register delivery
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Receipt {qrRef ?? ''} unavailable.</p>
        )}
      </div>
    </main>
  );
}
