'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { useShipmentHeaders } from '@/lib/use-shipment-headers';
import {
  buildShipmentReference,
  recordShipmentAssembly,
  type ShipmentAssemblyRecord,
} from '@/lib/shipment-assembly-service';
import {
  getNewShipmentLabel,
  getShipmentNavLabel,
  SUPPLY_CHAIN_FLOW_HINT,
} from '@/lib/supply-chain-terminology';
import {
  sumBatchWeightKg,
  validateShipmentWeightGuardrail,
} from '@/lib/shipment-weight-guardrail';
import { createCanonicalShipmentHeader } from '@/lib/shipment-headers-client';

export default function NewShipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const { packages, isLoading: packagesLoading, error: packagesError } = useHarvestPackages(tenantId, {
    scope: 'tenant',
  });
  const { usedPackageIds } = useShipmentHeaders(tenantId);

  const [label, setLabel] = useState('');
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [declaredQuantityKg, setDeclaredQuantityKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preselectedIds = useMemo(() => {
    const raw = searchParams.get('packageIds') ?? searchParams.get('packageId') ?? '';
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    if (preselectedIds.length === 0) return;
    setSelectedPackageIds((current) => {
      const merged = new Set([...current, ...preselectedIds]);
      return [...merged];
    });
  }, [preselectedIds]);

  const eligiblePackages = useMemo(
    () =>
      packages.filter(
        (pkg) =>
          !usedPackageIds.has(pkg.id) &&
          (pkg.status === 'DRAFT' || pkg.status === 'READY' || pkg.status === 'SEALED'),
      ),
    [packages, usedPackageIds],
  );

  const selectedPackages = eligiblePackages.filter((pkg) => selectedPackageIds.includes(pkg.id));
  const coveredQuantityKg = sumBatchWeightKg(selectedPackages);

  useEffect(() => {
    if (selectedPackages.length === 0) {
      setDeclaredQuantityKg('');
      return;
    }
    setDeclaredQuantityKg(String(coveredQuantityKg));
  }, [coveredQuantityKg, selectedPackages.length]);

  const weightGuardrail = validateShipmentWeightGuardrail(
    Number(declaredQuantityKg),
    coveredQuantityKg,
  );
  const weightMismatch = selectedPackageIds.length > 0 && !weightGuardrail.ok;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      toast.error('Missing tenant context.');
      return;
    }
    if (selectedPackageIds.length === 0) {
      toast.error('Select at least one batch to include in this shipment.');
      return;
    }

    if (!weightGuardrail.ok) {
      toast.error(weightGuardrail.message);
      return;
    }

    const now = new Date().toISOString();
    const shipment: ShipmentAssemblyRecord = {
      id: `shipment_${Date.now()}`,
      shipment_reference: buildShipmentReference(),
      label: label.trim() || `Shipment ${new Date().toLocaleDateString()}`,
      package_ids: selectedPackageIds,
      declared_quantity_kg: Number(declaredQuantityKg),
      covered_quantity_kg: coveredQuantityKg,
      status: 'DRAFT',
      created_at: now,
      updated_at: now,
    };

    setIsSubmitting(true);
    try {
      const result = await recordShipmentAssembly(tenantId, shipment);
      const created =
        result.shipments.find((row) => row.id === shipment.id) ??
        result.shipments[result.shipments.length - 1] ??
        shipment;

      let canonicalId: string | null = null;
      try {
        const canonical = await createCanonicalShipmentHeader({
          externalId: created.id,
          shipmentReference: created.shipment_reference,
          label: created.label,
          packageIds: created.package_ids,
          declaredQuantityKg: created.declared_quantity_kg,
          coveredQuantityKg: created.covered_quantity_kg,
        });
        canonicalId = canonical.id;
      } catch {
        toast.warning('Shipment draft saved, but canonical billing record is pending backend setup.');
      }

      toast.success(
        result.persistedRemotely
          ? 'Shipment created. Continue assembly to seal (€1 origin usage meters at seal).'
          : 'Shipment saved. Continue assembly to seal before EU filing.',
      );
      router.push(`/shipments/${canonicalId ?? created.id}/assemble`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getNewShipmentLabel(user?.active_role)}
        subtitle="Select batches (voucher packages) to combine into one EU-bound shipment"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: getShipmentNavLabel(user?.active_role), href: '/shipments' },
          { label: getNewShipmentLabel(user?.active_role) },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">{SUPPLY_CHAIN_FLOW_HINT}</p>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Batches</CardTitle>
                <CardDescription>
                  Each batch is a voucher bundle from verified plots. Combine one or more batches into this shipment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {packagesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading batches…</p>
                ) : packagesError ? (
                  <p className="text-sm text-destructive">{packagesError}</p>
                ) : eligiblePackages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No eligible batches available. Create batches from harvest vouchers first.
                  </p>
                ) : (
                  eligiblePackages.map((pkg) => {
                    const checked = selectedPackageIds.includes(pkg.id);
                    return (
                      <label
                        key={pkg.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary/40"
                      >
                        <Checkbox
                          checked={checked}
                          className="mt-0.5"
                          onCheckedChange={(value) => {
                            setSelectedPackageIds((current) =>
                              value === true
                                ? [...new Set([...current, pkg.id])]
                                : current.filter((id) => id !== pkg.id),
                            );
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{pkg.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {pkg.supplier_name} · {(pkg.total_weight_kg ?? 0).toLocaleString()} kg ·{' '}
                            {pkg.plots.length} plot(s) · {pkg.status}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="shipment_label" className="text-sm font-medium">
                    Shipment label
                  </label>
                  <Input
                    id="shipment_label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. March export container 1"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="batch_lineage_kg" className="text-sm font-medium">
                    Batch lineage total (kg)
                  </label>
                  <Input
                    id="batch_lineage_kg"
                    value={coveredQuantityKg > 0 ? String(coveredQuantityKg) : ''}
                    readOnly
                    className="bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sum of voucher harvest weight across selected batches.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="declared_quantity_kg" className="text-sm font-medium">
                    Declared shipment weight (kg)
                  </label>
                  <Input
                    id="declared_quantity_kg"
                    type="number"
                    min="0"
                    step="0.001"
                    value={declaredQuantityKg}
                    onChange={(e) => setDeclaredQuantityKg(e.target.value)}
                    placeholder="Must match batch lineage total"
                    className="bg-secondary"
                  />
                  {weightMismatch && (
                    <p className="text-xs text-destructive">{weightGuardrail.message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPackages.length} batch(es) selected
                </p>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || selectedPackageIds.length === 0 || weightMismatch}
                >
                  {isSubmitting ? 'Creating…' : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create &amp; Assemble
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
