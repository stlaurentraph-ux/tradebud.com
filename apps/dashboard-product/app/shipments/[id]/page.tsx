'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Lock } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import {
  getBatchNavLabel,
  getShipmentNavLabel,
  SUPPLY_CHAIN_FLOW_HINT,
} from '@/lib/supply-chain-terminology';
import { sumBatchWeightKg } from '@/lib/shipment-weight-guardrail';
import {
  getCanonicalShipmentHeader,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { listShipmentAssemblies, type ShipmentAssemblyRecord } from '@/lib/shipment-assembly-service';

interface ShipmentDetailPageProps {
  params: Promise<{ id: string }>;
}

function assemblyToHeader(assembly: ShipmentAssemblyRecord): CanonicalShipmentHeader {
  return {
    id: assembly.id,
    tenant_id: '',
    external_id: assembly.id,
    shipment_reference: assembly.shipment_reference,
    label: assembly.label,
    status: assembly.status,
    declared_quantity_kg: assembly.declared_quantity_kg,
    covered_quantity_kg: assembly.covered_quantity_kg,
    package_ids: assembly.package_ids,
    sealed_at: assembly.status === 'SEALED' ? assembly.updated_at : null,
    created_at: assembly.created_at,
    updated_at: assembly.updated_at,
  };
}

export default function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const { packages } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const [shipment, setShipment] = useState<CanonicalShipmentHeader | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const canonical = await getCanonicalShipmentHeader(id);
        if (!cancelled) {
          setShipment(canonical);
          setError(null);
        }
        return;
      } catch {
        // Fall back to audit assembly rows for legacy URLs.
      }

      if (!tenantId) {
        if (!cancelled) setError('Shipment not found.');
        return;
      }

      try {
        const rows = await listShipmentAssemblies(tenantId);
        const match = rows.find((row) => row.id === id) ?? null;
        if (!cancelled) {
          if (match) {
            setShipment(assemblyToHeader(match));
            setError(null);
          } else {
            setShipment(null);
            setError('Shipment not found.');
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setShipment(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load shipment.');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, tenantId]);

  const includedBatches = useMemo(
    () => packages.filter((pkg) => shipment?.package_ids.includes(pkg.id)),
    [packages, shipment],
  );
  const coveredQuantityKg = sumBatchWeightKg(includedBatches);

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  if (!shipment) {
    return <div className="p-6 text-sm text-muted-foreground">Loading shipment…</div>;
  }

  const canAssemble = shipment.status === 'DRAFT' || shipment.status === 'READY';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={shipment.shipment_reference}
        subtitle={shipment.label}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: getShipmentNavLabel(user?.active_role), href: '/shipments' },
          { label: shipment.shipment_reference },
        ]}
        actions={
          canAssemble ? (
            <Button asChild>
              <Link href={`/shipments/${shipment.id}/assemble`}>
                <Lock className="mr-2 h-4 w-4" />
                Assemble &amp; Seal
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">{SUPPLY_CHAIN_FLOW_HINT}</p>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Included {getBatchNavLabel(user?.active_role)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {includedBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No batches linked yet.</p>
              ) : (
                includedBatches.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-border p-3">
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
              <CardTitle className="text-base">Shipment status</CardTitle>
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
