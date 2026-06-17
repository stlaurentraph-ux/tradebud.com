'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Layers, Lock } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBatchNavLabel,
  getPackageDetailBackLabel,
  getPackagesPageTitle,
  getShipmentAssembleCtaLabel,
  getShipmentNavLabel,
  getShipmentStatusTitle,
  getSupplyChainFlowHint,
} from '@/lib/workflow-terminology-labels';
import { sumBatchWeightKg } from '@/lib/shipment-weight-guardrail';
import {
  resolveShipmentHeaderForAssembly,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { listShipmentAssemblies } from '@/lib/shipment-assembly-service';
import { useDemoData } from '@/lib/demo-data-context';
import { getMockShipmentHeaderById } from '@/lib/mocks/shipment-headers';

export function ShipmentHeaderNotFound({ t }: { t?: (key: string) => string }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">Shipment not found</p>
        <p className="text-sm text-muted-foreground">
          This shipment reference could not be loaded. It may have been removed or you may not have
          access.
        </p>
        <Button variant="outline" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {getPackageDetailBackLabel(undefined, t)}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const tenantId = user?.tenant_id ?? null;
  const { demoDataEnabled } = useDemoData();
  const shipmentsPageTitle = useMemo(() => getPackagesPageTitle(role, t), [role, t]);
  const { packages } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const [shipment, setShipment] = useState<CanonicalShipmentHeader | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setShipment(null);
      setIsLoading(false);
      return;
    }

    if (demoDataEnabled) {
      setShipment(getMockShipmentHeaderById(id));
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void resolveShipmentHeaderForAssembly(id, tenantId, listShipmentAssemblies)
      .then((resolved) => {
        if (!cancelled) {
          setShipment(resolved);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          const mockFallback =
            process.env.NODE_ENV !== 'production' ? getMockShipmentHeaderById(id) : null;
          if (mockFallback) {
            setShipment(mockFallback);
            setError(null);
            return;
          }
          setShipment(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load shipment.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, tenantId, demoDataEnabled]);

  const includedBatches = useMemo(
    () => packages.filter((pkg) => shipment?.package_ids.includes(pkg.id)),
    [packages, shipment],
  );
  const coveredQuantityKg = sumBatchWeightKg(includedBatches);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading shipment…</div>;
  }

  if (!shipment) {
    return (
      <div className="flex flex-col">
        <AppHeader
          title={id}
          subtitle={getShipmentNavLabel(role, t)}
          breadcrumbs={[
            { label: getDashboardBreadcrumbLabel(t), href: '/' },
            { label: shipmentsPageTitle, href: '/packages' },
            { label: id },
          ]}
        />
        <div className="p-6">
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <ShipmentHeaderNotFound t={t} />
        </div>
      </div>
    );
  }

  const canAssemble = shipment.status === 'DRAFT' || shipment.status === 'READY';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={shipment.shipment_reference}
        subtitle={shipment.label}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: shipmentsPageTitle, href: '/packages' },
          { label: shipment.shipment_reference },
        ]}
        actions={
          canAssemble ? (
            <Button asChild>
              <Link href={`/shipments/${shipment.id}/assemble`}>
                <Lock className="mr-2 h-4 w-4" />
                {getShipmentAssembleCtaLabel(t)}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getPackageDetailBackLabel(role, t)}
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">{getSupplyChainFlowHint(t)}</p>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Included {getBatchNavLabel(role, t)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {includedBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No batches linked yet.</p>
              ) : (
                includedBatches.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{pkg.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {pkg.supplier_name} · {(pkg.total_weight_kg ?? 0).toLocaleString()} kg ·{' '}
                        {pkg.plots.length} plot(s)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/packages/${pkg.id}`}>Open batch</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{getShipmentStatusTitle(t)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{shipment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batches</span>
                <span className="font-medium">{shipment.package_ids.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Declared weight</span>
                <span className="font-medium">
                  {(shipment.declared_quantity_kg ?? coveredQuantityKg).toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch lineage</span>
                <span className="font-medium">{coveredQuantityKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(shipment.created_at).toLocaleDateString()}</span>
              </div>
              {shipment.sealed_at ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sealed</span>
                  <span>{new Date(shipment.sealed_at).toLocaleDateString()}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
