import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package, QrCode } from 'lucide-react';
import {
  buildDashboardClaimUrl,
  buildDashboardLoginUrlForClaim,
  buildDashboardSignupUrlForClaim,
} from '@/lib/delivery-intake-links';

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

async function loadPreview(ref: string): Promise<DeliveryPreview | null> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) return null;
  const response = await fetch(
    `${backendBase}/v1/public/harvest/delivery-preview/${encodeURIComponent(ref)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) return null;
  const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryPreview };
  return body.preview ?? null;
}

function dashboardClaimUrl(qrRef: string): string {
  return buildDashboardClaimUrl(qrRef);
}

function formatKg(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString()} kg`;
}

export default async function MarketingDeliveryPreviewPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const preview = await loadPreview(ref.trim());
  if (!preview) notFound();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <QrCode className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-foreground">Tracebud delivery receipt</h1>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="text-base font-medium text-foreground">{preview.plotName ?? 'Plot delivery'}</p>
          <p>{formatKg(preview.kg)}</p>
          {preview.harvestDate ? (
            <p>Delivery date: {new Date(preview.harvestDate).toLocaleDateString()}</p>
          ) : null}
          <p className="font-mono text-xs">{preview.qrRef}</p>
          <p
            className={
              preview.eligibleForBuyerIntake ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'
            }
          >
            {preview.eligibleForBuyerIntake
              ? 'Ready for buyer registration'
              : preview.intakeBlockReason === 'already_packaged'
                ? 'Already registered in a batch'
                : 'Plot verification still in progress'}
          </p>
        </div>
        <Link
          href={dashboardClaimUrl(preview.qrRef)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Package className="h-4 w-4" />
          Register delivery in Tracebud
        </Link>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link
            href={buildDashboardSignupUrlForClaim(preview.qrRef)}
            className="font-medium text-primary hover:underline"
          >
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
    </main>
  );
}
