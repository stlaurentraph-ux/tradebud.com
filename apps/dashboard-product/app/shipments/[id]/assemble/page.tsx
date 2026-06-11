'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGate } from '@/components/common/permission-gate';
import { useAuth } from '@/lib/auth-context';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { listShipmentAssemblies } from '@/lib/shipment-assembly-service';
import { getBatchNavLabel, getShipmentNavLabel } from '@/lib/supply-chain-terminology';
import {
  RULE_SHIPMENT_WEIGHT_MISMATCH,
  sumBatchWeightKg,
  validateShipmentWeightGuardrail,
} from '@/lib/shipment-weight-guardrail';
import {
  resolveCanonicalShipmentHeaderId,
  resolveShipmentHeaderForAssembly,
  sealCanonicalShipmentHeader,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { fetchAdoptionPromo } from '@/lib/billing-client';

interface AssemblePageProps {
  params: Promise<{ id: string }>;
}

type StepType = 'select_batches' | 'allocate_coverage' | 'validate_issues' | 'seal_shipment';

export default function AssembleShipmentPage({ params }: AssemblePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const { packages } = useHarvestPackages(tenantId, { scope: 'tenant' });

  const [shipment, setShipment] = useState<CanonicalShipmentHeader | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepType>('select_batches');
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false);
  const [sealConfirmed, setSealConfirmed] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [firstSealFree, setFirstSealFree] = useState(false);

  useEffect(() => {
    fetchAdoptionPromo()
      .then((promo) => setFirstSealFree(promo?.first_origin_seal_available ?? false))
      .catch(() => setFirstSealFree(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    resolveShipmentHeaderForAssembly(id, tenantId, listShipmentAssemblies)
      .then((header) => {
        if (!cancelled) {
          setShipment(header);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setShipment(null);
          setLoadError(error instanceof Error ? error.message : 'Failed to load shipment.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, id]);

  const includedBatches = useMemo(
    () => packages.filter((pkg) => shipment?.package_ids.includes(pkg.id)),
    [packages, shipment],
  );

  const totalPlots = includedBatches.reduce((sum, pkg) => sum + pkg.plots.length, 0);
  const liveCoveredQuantityKg = sumBatchWeightKg(includedBatches);
  const declaredQuantityKg = shipment?.declared_quantity_kg ?? liveCoveredQuantityKg;
  const weightGuardrail = validateShipmentWeightGuardrail(declaredQuantityKg, liveCoveredQuantityKg);
  const hasWeightMismatch = !weightGuardrail.ok;
  const isAlreadySealed = shipment?.status === 'SEALED';
  const canSeal =
    liabilityAcknowledged &&
    sealConfirmed &&
    includedBatches.length > 0 &&
    !hasWeightMismatch &&
    !isAlreadySealed;

  const steps = [
    { id: 'select_batches', label: 'Included Batches', description: 'Voucher packages in this shipment' },
    { id: 'allocate_coverage', label: 'Allocate Coverage', description: 'Assign to shipment lines' },
    { id: 'validate_issues', label: 'Validate Issues', description: 'Check blocking conditions' },
    { id: 'seal_shipment', label: 'Seal Shipment', description: 'Finalize before EU filing' },
  ] as const;

  if (loadError) {
    return <div className="p-6 text-sm text-destructive">{loadError}</div>;
  }

  if (!shipment) {
    return <div className="p-6 text-sm text-muted-foreground">Loading shipment assembly…</div>;
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={`Assemble ${shipment.shipment_reference}`}
        subtitle={shipment.label}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: getShipmentNavLabel(user?.active_role), href: '/shipments' },
          { label: shipment.shipment_reference, href: `/shipments/${shipment.id}` },
          { label: 'Assemble' },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={`/shipments/${shipment.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipment
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  currentStep === step.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/50'
                }`}
              >
                <div className="font-medium text-sm">{step.label}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </button>
            ))}
          </div>

          <div className="space-y-6 lg:col-span-3">
            {currentStep === 'select_batches' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Included {getBatchNavLabel(user?.active_role)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    These voucher bundles are locked into this shipment. Edit batch membership from shipment
                    settings before sealing.
                  </p>
                  {includedBatches.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No linked batches found. Add batches when creating the shipment.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {includedBatches.map((pkg) => (
                        <div key={pkg.id} className="rounded-lg border border-border p-3">
                          <div className="font-medium text-sm">{pkg.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {pkg.supplier_name} · {(pkg.total_weight_kg ?? 0).toLocaleString()} kg ·{' '}
                            {pkg.plots.length} plot(s) · {pkg.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep('allocate_coverage')} disabled={includedBatches.length === 0}>
                      Next: Allocate Coverage
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'allocate_coverage' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Allocate Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Map batch lineage to shipment lines before EU filing. Full line-level coverage editing ships with
                    canonical shipment_headers.
                  </p>
                  <Alert>
                    <AlertDescription>
                      {includedBatches.length} batch(es) · {totalPlots} contributing plot(s) ·{' '}
                      {liveCoveredQuantityKg.toLocaleString()} kg batch lineage in this shipment draft.
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('select_batches')}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep('validate_issues')}>
                      Next: Validate Issues
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'validate_issues' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Validate Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasWeightMismatch ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">{RULE_SHIPMENT_WEIGHT_MISMATCH}</span>
                        {' — '}
                        {weightGuardrail.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">
                        Shipment weight matches batch lineage ({declaredQuantityKg.toLocaleString()} kg).
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('allocate_coverage')}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep('seal_shipment')} disabled={hasWeightMismatch}>
                      Next: Seal Shipment
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'seal_shipment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Step 4: Seal Shipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasWeightMismatch && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{weightGuardrail.message}</AlertDescription>
                    </Alert>
                  )}
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Declared shipment weight</span>
                      <span className="font-medium">{declaredQuantityKg.toLocaleString()} kg</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-muted-foreground">Batch lineage total</span>
                      <span className="font-medium">{liveCoveredQuantityKg.toLocaleString()} kg</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {firstSealFree
                        ? 'Your first shipment seal is free. Using it ends the 3-month subscription-free offer this month — subscription billing starts next month.'
                        : 'Sealing meters €1 origin usage for this month&apos;s invoice. Your importer pays €1 when they submit DDS to TRACES.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-secondary/50">
                    <Checkbox
                      checked={liabilityAcknowledged}
                      onCheckedChange={(checked) => setLiabilityAcknowledged(checked === true)}
                      className="mt-1"
                    />
                    <label className="text-sm">
                      <div className="font-medium">I acknowledge operator liability for this EU shipment</div>
                    </label>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={sealConfirmed}
                      onCheckedChange={(checked) => setSealConfirmed(checked === true)}
                      className="mt-1"
                    />
                    <label className="text-sm">I confirm I want to seal this shipment now</label>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('validate_issues')}>
                      Back
                    </Button>
                    <PermissionGate permission="packages:seal_shipment">
                      <Button
                        disabled={!canSeal || isSealing}
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          if (!shipment) return;
                          setIsSealing(true);
                          try {
                            const headerId =
                              (await resolveCanonicalShipmentHeaderId(shipment.external_id ?? shipment.id)) ??
                              shipment.id;
                            await sealCanonicalShipmentHeader(headerId);
                            toast.success(
                              'Shipment sealed. €1 origin usage metered for this month. Continue to compliance for filing.',
                            );
                            router.push('/compliance');
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : 'Failed to seal shipment.',
                            );
                          } finally {
                            setIsSealing(false);
                          }
                        }}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {isSealing ? 'Sealing…' : 'Seal Shipment'}
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
