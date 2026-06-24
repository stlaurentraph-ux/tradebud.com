import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package, QrCode } from 'lucide-react';
import {
  buildDashboardClaimUrl,
  buildDashboardLoginUrlForClaim,
  buildDashboardSignupUrlForClaim,
} from '@/lib/delivery-intake-links';

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

async function loadTripPreview(ref: string): Promise<DeliveryTripPreview | null> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) return null;
  const response = await fetch(
    `${backendBase}/v1/public/harvest/delivery-trip-preview/${encodeURIComponent(ref)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) return null;
  const body = (await response.json().catch(() => ({}))) as { preview?: DeliveryTripPreview };
  return body.preview ?? null;
}

function dashboardClaimUrl(tripRef: string): string {
  return buildDashboardClaimUrl(tripRef);
}

export default async function MarketingDeliveryTripPreviewPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const preview = await loadTripPreview(ref.trim());
  if (!preview) notFound();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <QrCode className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-foreground">Tracebud delivery trip</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {preview.lineCount} plot(s) · {preview.totalKg.toLocaleString()} kg total
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{preview.tripRef}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {preview.lines.map((line) => (
            <li key={line.qrRef} className="rounded-md border border-border px-3 py-2">
              <p className="font-medium text-foreground">{line.plotName ?? 'Plot'}</p>
              <p className="text-muted-foreground">{(line.kg ?? 0).toLocaleString()} kg · {line.qrRef}</p>
            </li>
          ))}
        </ul>
        <Link
          href={dashboardClaimUrl(preview.tripRef)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Package className="h-4 w-4" />
          Register trip in Tracebud
        </Link>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
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
    </main>
  );
}
