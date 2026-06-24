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
  type DeliveryPublicPreview,
} from '@/lib/delivery-intake-qr';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';
import { cn } from '@/lib/utils';

type DeliveryPreviewPageProps = {
  params: Promise<{ ref: string }>;
};

const STEPS = [
  { step: '1', title: 'Scan receipt', body: 'You opened the QR from a field delivery.' },
  { step: '2', title: 'Sign in', body: 'Use your cooperative or buyer workspace.' },
  { step: '3', title: 'Confirm at desk', body: 'Register weight and assemble your batch.' },
] as const;

function formatKg(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString()} kg`;
}

function resolveStatus(preview: DeliveryPublicPreview): 'ready' | 'pending' | 'already_registered' {
  if (preview.eligibleForBuyerIntake) return 'ready';
  if (preview.intakeBlockReason === 'already_packaged') return 'already_registered';
  return 'pending';
}

const STATUS_LABEL = {
  ready: 'Ready for registration',
  pending: 'Verification in progress',
  already_registered: 'Already registered',
} as const;

const STATUS_VARIANT = {
  ready: 'success' as const,
  pending: 'warning' as const,
  already_registered: 'secondary' as const,
};

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
  const status = preview ? resolveStatus(preview) : null;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <TracebudLogo size="xs" />
          <div>
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-lg font-semibold">Delivery receipt</h1>
            </div>
            <p className="text-xs text-muted-foreground">Field harvest · buyer registration</p>
          </div>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading receipt…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : preview && status ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <p className="text-base font-medium">{preview.plotName ?? 'Plot delivery'}</p>
              <p className="mt-1 text-2xl font-semibold">{formatKg(preview.kg)}</p>
              {preview.harvestDate ? (
                <p className="mt-1 text-muted-foreground">
                  Delivery date: {new Date(preview.harvestDate).toLocaleDateString()}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-xs text-muted-foreground">{preview.qrRef}</p>
              <Badge variant={STATUS_VARIANT[status]} className={cn('mt-2')}>
                {STATUS_LABEL[status]}
              </Badge>
              {preview.directedToBuyer ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  The producer directed this delivery to a buyer on Tracebud.
                </p>
              ) : null}
            </div>

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
              Sign in to register delivery
            </Link>
            <div className="flex flex-col gap-2 text-center text-sm">
              <Link href={buildDashboardSignupUrlForClaim(preview.qrRef)} className="font-medium text-primary hover:underline">
                Create a workspace to claim this delivery
              </Link>
              <Link
                href={buildDashboardLoginUrlForClaim(preview.qrRef)}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Receipt {qrRef ?? ''} unavailable.</p>
        )}
      </div>
    </main>
  );
}
