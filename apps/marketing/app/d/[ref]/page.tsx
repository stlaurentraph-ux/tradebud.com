import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Package, QrCode } from 'lucide-react';
import {
  DeliveryIntakeStatusBadge,
  DeliveryIntakeSteps,
  resolveDeliveryIntakeStatus,
} from '@/components/delivery-intake/delivery-intake-preview-chrome';
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
          <p className="text-base font-medium text-foreground">{preview.plotName ?? 'Plot delivery'}</p>
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

        <Link
          href={buildDashboardClaimUrl(preview.qrRef)}
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
