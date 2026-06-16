'use client';

import { use, useContext, useEffect, useMemo, useState } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  formatShipmentAssembleAllocateSummary,
  formatShipmentAssembleWeightMatchOk,
  getAssemblyBackLabel,
  getAssemblyNextAllocateLabel,
  getAssemblyNextSealLabel,
  getAssemblyNextValidateLabel,
  getBatchNavLabel,
  getSealBillingHint,
  getShipmentAssembleAllocateIntro,
  getShipmentAssembleBreadcrumbLabel,
  getShipmentAssembleFirstSealFreeHint,
  getShipmentAssembleLiabilityTitle,
  getShipmentAssembleNoBatchesAlert,
  getShipmentAssemblePageTitle,
  getShipmentAssembleSealConfirmLabel,
  getShipmentAssembleSealCtaLabel,
  getShipmentAssembleSealDeclaredWeightLabel,
  getShipmentAssembleSealErrorToast,
  getShipmentAssembleSealLineageTotalLabel,
  getShipmentAssembleSealSuccessToast,
  getShipmentAssembleStep1Intro,
  getShipmentAssemblyStepTitle,
  getShipmentAssemblySteps,
  getShipmentBackToShipmentLabel,
  getShipmentLoadingAssemblyMessage,
  getShipmentNavLabel,
} from '@/lib/workflow-terminology-labels';
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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
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

  const steps = getShipmentAssemblySteps(t);

  if (loadError) {
    return <div className="p-6 text-sm text-destructive">{loadError}</div>;
  }

  if (!shipment) {
    return <div className="p-6 text-sm text-muted-foreground">{getShipmentLoadingAssemblyMessage(t)}</div>;
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getShipmentAssemblePageTitle(shipment.shipment_reference, t)}
        subtitle={shipment.label}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getShipmentNavLabel(user?.active_role, t), href: '/shipments' },
          { label: shipment.shipment_reference, href: `/shipments/${shipment.id}` },
          { label: getShipmentAssembleBreadcrumbLabel(t) },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={`/shipments/${shipment.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getShipmentBackToShipmentLabel(t)}
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
                  <CardTitle>
                    {getShipmentAssemblyStepTitle(1, getBatchNavLabel(user?.active_role, t), t)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{getShipmentAssembleStep1Intro(t)}</p>
                  {includedBatches.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{getShipmentAssembleNoBatchesAlert(t)}</AlertDescription>
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
                      {getAssemblyNextAllocateLabel(t)}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'allocate_coverage' && (
              <Card>
                <CardHeader>
                  <CardTitle>{getShipmentAssemblyStepTitle(2, '', t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{getShipmentAssembleAllocateIntro(t)}</p>
                  <Alert>
                    <AlertDescription>
                      {formatShipmentAssembleAllocateSummary(
                        includedBatches.length,
                        totalPlots,
                        liveCoveredQuantityKg,
                        t,
                      )}
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('select_batches')}>
                      {getAssemblyBackLabel(t)}
                    </Button>
                    <Button onClick={() => setCurrentStep('validate_issues')}>
                      {getAssemblyNextValidateLabel(t)}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'validate_issues' && (
              <Card>
                <CardHeader>
                  <CardTitle>{getShipmentAssemblyStepTitle(3, '', t)}</CardTitle>
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
                        {formatShipmentAssembleWeightMatchOk(declaredQuantityKg, t)}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('allocate_coverage')}>
                      {getAssemblyBackLabel(t)}
                    </Button>
                    <Button onClick={() => setCurrentStep('seal_shipment')} disabled={hasWeightMismatch}>
                      {getAssemblyNextSealLabel(t)}
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
                    {getShipmentAssemblyStepTitle(4, '', t)}
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
                      <span className="text-muted-foreground">{getShipmentAssembleSealDeclaredWeightLabel(t)}</span>
                      <span className="font-medium">{declaredQuantityKg.toLocaleString()} kg</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-muted-foreground">{getShipmentAssembleSealLineageTotalLabel(t)}</span>
                      <span className="font-medium">{liveCoveredQuantityKg.toLocaleString()} kg</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {firstSealFree
                        ? getShipmentAssembleFirstSealFreeHint(t)
                        : getSealBillingHint(user?.active_role, t)}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-secondary/50">
                    <Checkbox
                      checked={liabilityAcknowledged}
                      onCheckedChange={(checked) => setLiabilityAcknowledged(checked === true)}
                      className="mt-1"
                    />
                    <label className="text-sm">
                      <div className="font-medium">{getShipmentAssembleLiabilityTitle(t)}</div>
                    </label>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={sealConfirmed}
                      onCheckedChange={(checked) => setSealConfirmed(checked === true)}
                      className="mt-1"
                    />
                    <label className="text-sm">{getShipmentAssembleSealConfirmLabel(t)}</label>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('validate_issues')}>
                      {getAssemblyBackLabel(t)}
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
                            toast.success(getShipmentAssembleSealSuccessToast(t));
                            router.push('/compliance');
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : getShipmentAssembleSealErrorToast(t),
                            );
                          } finally {
                            setIsSealing(false);
                          }
                        }}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {getShipmentAssembleSealCtaLabel(isSealing, t)}
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
