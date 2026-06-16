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
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/common/permission-gate';
import { useAuth } from '@/lib/auth-context';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { usePackageDetail } from '@/lib/use-package-detail';
import { usePackageReadiness } from '@/lib/use-package-readiness';
import { fetchAdoptionPromo } from '@/lib/billing-client';
import { LocaleContext } from '@/lib/locale-context';
import {
  formatPackageAssembleAllocateSummary,
  formatPackageAssembleBlockersCount,
  formatPackageAssembleLineageSummary,
  formatPackageAssembleWeightMatchOk,
  formatPackageAssembleWeightMustMatch,
  getAssemblyBackLabel,
  getAssemblyCancelLabel,
  getAssemblyNextAllocateLabel,
  getAssemblyNextSealLabel,
  getAssemblyNextValidateLabel,
  getBatchNavLabel,
  getAssembleShipmentSubtitle,
  getAssembleBreadcrumbLabel,
  getAssemblePageTitle,
  getAssembleSealedAlertMessage,
  getBackToPackageDetailLabel,
  getPackageLoadErrorPrefix,
  getPackageNotFoundMessage,
  buildPackageBreadcrumbs,
  getPackageAssembleAdditionalBatchesLabel,
  getPackageAssembleAllocateIntro,
  getPackageAssembleDeclaredWeightLabel,
  getPackageAssembleFirstSealFreeHint,
  getPackageAssembleLiabilityBody,
  getPackageAssembleLiabilityTitle,
  getPackageAssembleLineageTotalLabel,
  getPackageAssembleLoadingMessage,
  getPackageAssembleNoVouchersAlert,
  getPackageAssembleSealConfirmLabel,
  getPackageAssembleSealCtaLabel,
  getPackageAssembleSealDeclaredWeightLabel,
  getPackageAssembleSealErrorToast,
  getPackageAssembleSealSuccessToast,
  getPackageAssembleSealWarning,
  getPackageAssembleSelectIntro,
  getPackageAssembleSelectedBatchesLabel,
  getPackageAssembleStep1Title,
  getPackageAssembleStep2Title,
  getPackageAssembleStep3Title,
  getPackageAssemblySteps,
  getSealBillingHint,
  getShipmentAssemblyStepTitle,
} from '@/lib/workflow-terminology-labels';
import {
  buildShipmentReference,
  recordShipmentAssembly,
  type ShipmentAssemblyRecord,
} from '@/lib/shipment-assembly-service';
import {
  RULE_SHIPMENT_WEIGHT_MISMATCH,
  validateShipmentWeightGuardrail,
} from '@/lib/shipment-weight-guardrail';
import {
  createCanonicalShipmentHeader,
  findCanonicalShipmentHeaderForPackage,
  sealCanonicalShipmentHeader,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { useShipmentHeaders } from '@/lib/use-shipment-headers';

interface AssemblePageProps {
  params: Promise<{ id: string }>;
}

type StepType = 'select_batches' | 'allocate_coverage' | 'validate_issues' | 'seal_shipment';

function resolveBatchWeightKg(
  batchId: string,
  primaryPackageId: string,
  primaryPackageKg: number,
  packages: Array<{ id: string; total_weight_kg?: number }>,
): number {
  if (batchId === primaryPackageId) {
    return primaryPackageKg;
  }
  const match = packages.find((pkg) => pkg.id === batchId);
  return Number(match?.total_weight_kg ?? 0);
}

export default function AssembleShipmentPage({ params }: AssemblePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const tenantId = user?.tenant_id ?? null;

  const { pkg, vouchers, isLoading, error } = usePackageDetail(id, tenantId);
  const { data: readiness } = usePackageReadiness(id);
  const { packages } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const { usedPackageIds } = useShipmentHeaders(tenantId);

  const [currentStep, setCurrentStep] = useState<StepType>('select_batches');
  const [additionalPackageIds, setAdditionalPackageIds] = useState<string[]>([]);
  const [declaredQuantityKg, setDeclaredQuantityKg] = useState('');
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false);
  const [sealConfirmed, setSealConfirmed] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [firstSealFree, setFirstSealFree] = useState(false);
  const [existingHeader, setExistingHeader] = useState<CanonicalShipmentHeader | null>(null);

  const primaryPackageKg = useMemo(
    () => Number(pkg?.total_weight_kg ?? 0),
    [pkg?.total_weight_kg],
  );

  const selectedPackageIds = useMemo(
    () => [id, ...additionalPackageIds.filter((packageId) => packageId !== id)],
    [additionalPackageIds, id],
  );

  const coveredQuantityKg = useMemo(
    () =>
      selectedPackageIds.reduce(
        (sum, packageId) =>
          sum + resolveBatchWeightKg(packageId, id, primaryPackageKg, packages),
        0,
      ),
    [id, packages, primaryPackageKg, selectedPackageIds],
  );

  useEffect(() => {
    fetchAdoptionPromo()
      .then((promo) => setFirstSealFree(promo?.first_origin_seal_available ?? false))
      .catch(() => setFirstSealFree(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    findCanonicalShipmentHeaderForPackage(id)
      .then(setExistingHeader)
      .catch(() => setExistingHeader(null));
  }, [id]);

  useEffect(() => {
    if (coveredQuantityKg > 0 && !declaredQuantityKg) {
      setDeclaredQuantityKg(String(coveredQuantityKg));
    }
  }, [coveredQuantityKg, declaredQuantityKg]);

  const eligibleAdditionalPackages = useMemo(
    () =>
      packages.filter(
        (candidate) =>
          candidate.id !== id &&
          !usedPackageIds.has(candidate.id) &&
          !existingHeader?.package_ids.includes(candidate.id) &&
          (candidate.status === 'DRAFT' || candidate.status === 'READY'),
      ),
    [existingHeader?.package_ids, id, packages, usedPackageIds],
  );

  const selectedAdditionalPackages = eligibleAdditionalPackages.filter((candidate) =>
    additionalPackageIds.includes(candidate.id),
  );

  const readinessBlockers = readiness?.blockers ?? [];
  const declaredKg = Number(declaredQuantityKg);
  const weightGuardrail = validateShipmentWeightGuardrail(declaredKg, coveredQuantityKg);
  const hasWeightMismatch = selectedPackageIds.length > 0 && !weightGuardrail.ok;
  const isAlreadySealed = existingHeader?.status === 'SEALED';
  const canProceedToAllocate = selectedPackageIds.length > 0 && primaryPackageKg > 0;
  const canProceedToValidate = canProceedToAllocate && !hasWeightMismatch;
  const canSeal =
    liabilityAcknowledged &&
    sealConfirmed &&
    canProceedToValidate &&
    readinessBlockers.length === 0 &&
    !isAlreadySealed;

  const steps = useMemo(() => getPackageAssemblySteps(t), [t]);

  const ensureShipmentHeader = async (): Promise<CanonicalShipmentHeader> => {
    if (existingHeader) {
      if (existingHeader.status === 'SEALED') {
        throw new Error('This package is already linked to a sealed shipment.');
      }
      return existingHeader;
    }

    const now = new Date().toISOString();
    const assemblyId = `shipment_${Date.now()}`;
    const shipment: ShipmentAssemblyRecord = {
      id: assemblyId,
      shipment_reference: buildShipmentReference(pkg?.year ?? new Date().getFullYear()),
      label: pkg?.code ?? `Package ${id.slice(0, 8)}`,
      package_ids: selectedPackageIds,
      declared_quantity_kg: declaredKg,
      covered_quantity_kg: coveredQuantityKg,
      status: 'DRAFT',
      created_at: now,
      updated_at: now,
    };

    if (tenantId) {
      await recordShipmentAssembly(tenantId, shipment);
    }

    const canonical = await createCanonicalShipmentHeader({
      externalId: assemblyId,
      shipmentReference: shipment.shipment_reference,
      label: shipment.label,
      packageIds: selectedPackageIds,
      declaredQuantityKg: declaredKg,
      coveredQuantityKg: coveredQuantityKg,
    });
    setExistingHeader(canonical);
    return canonical;
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{getPackageAssembleLoadingMessage(t)}</div>;
  }

  if (!pkg) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error ? `${getPackageLoadErrorPrefix(role, t)}: ${error}` : getPackageNotFoundMessage(role, t)}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getAssemblePageTitle(pkg.code, t)}
        subtitle={getAssembleShipmentSubtitle(role, t)}
        breadcrumbs={buildPackageBreadcrumbs(role, pkg.code, pkg.id, {
          label: getAssembleBreadcrumbLabel(t),
        }, t)}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={`/packages/${pkg.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getBackToPackageDetailLabel(role, t)}
          </Link>
        </Button>

        {isAlreadySealed && existingHeader ? (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription>
              {getAssembleSealedAlertMessage(role, existingHeader.shipment_reference, t)}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === 'select_batches') setCurrentStep(step.id);
                  else if (step.id === 'allocate_coverage' && canProceedToAllocate) setCurrentStep(step.id);
                  else if (step.id === 'validate_issues' && canProceedToValidate) setCurrentStep(step.id);
                  else if (step.id === 'seal_shipment' && canProceedToValidate) setCurrentStep(step.id);
                }}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  currentStep === step.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-6 lg:col-span-3">
            {currentStep === 'select_batches' && (
              <Card>
                <CardHeader>
                  <CardTitle>{getPackageAssembleStep1Title(getBatchNavLabel(user?.active_role, t), t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{getPackageAssembleSelectIntro(t)}</p>

                  <div className="rounded-lg border border-border p-3">
                    <div className="font-medium text-sm">{pkg.code}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {pkg.supplier_name} · {primaryPackageKg.toLocaleString()} kg · {vouchers.length}{' '}
                      voucher(s) · {pkg.plots.length} plot(s)
                    </div>
                  </div>

                  {vouchers.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{getPackageAssembleNoVouchersAlert(t)}</AlertDescription>
                    </Alert>
                  ) : null}

                  {eligibleAdditionalPackages.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">{getPackageAssembleAdditionalBatchesLabel(t)}</p>
                      {eligibleAdditionalPackages.map((candidate) => (
                        <label
                          key={candidate.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary/40"
                        >
                          <Checkbox
                            checked={additionalPackageIds.includes(candidate.id)}
                            className="mt-0.5"
                            onCheckedChange={(checked) => {
                              setAdditionalPackageIds((current) =>
                                checked === true
                                  ? [...new Set([...current, candidate.id])]
                                  : current.filter((packageId) => packageId !== candidate.id),
                              );
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{candidate.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.supplier_name} · {(candidate.total_weight_kg ?? 0).toLocaleString()}{' '}
                              kg · {candidate.plots.length} plot(s)
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {selectedPackageIds.length > 0 ? (
                    <Card className="bg-secondary/50 border-border">
                      <CardContent className="pt-4">
                        <div className="text-sm">
                          <div className="text-muted-foreground">{getPackageAssembleLineageTotalLabel(t)}</div>
                          <div className="text-lg font-semibold">
                            {formatPackageAssembleLineageSummary(coveredQuantityKg, selectedPackageIds.length, t)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/packages/${pkg.id}`}>{getAssemblyCancelLabel(t)}</Link>
                    </Button>
                    <Button disabled={!canProceedToAllocate} onClick={() => setCurrentStep('allocate_coverage')}>
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
                  <CardTitle>{getPackageAssembleStep2Title(t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{getPackageAssembleAllocateIntro(t)}</p>

                  <Alert>
                    <AlertDescription>
                      {formatPackageAssembleAllocateSummary(
                        selectedPackageIds.length,
                        pkg.plots.length +
                          selectedAdditionalPackages.reduce((sum, batch) => sum + batch.plots.length, 0),
                        coveredQuantityKg,
                        t,
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label htmlFor="declared_quantity_kg" className="text-sm font-medium">
                      {getPackageAssembleDeclaredWeightLabel(t)}
                    </label>
                    <Input
                      id="declared_quantity_kg"
                      type="number"
                      min="0"
                      step="0.001"
                      value={declaredQuantityKg}
                      onChange={(e) => setDeclaredQuantityKg(e.target.value)}
                      className="bg-secondary"
                    />
                    {hasWeightMismatch ? (
                      <p className="text-xs text-destructive">{weightGuardrail.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {formatPackageAssembleWeightMustMatch(coveredQuantityKg, t)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep('select_batches')}>
                      {getAssemblyBackLabel(t)}
                    </Button>
                    <Button disabled={!canProceedToValidate} onClick={() => setCurrentStep('validate_issues')}>
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
                  <CardTitle>{getPackageAssembleStep3Title(t)}</CardTitle>
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
                        {formatPackageAssembleWeightMatchOk(declaredKg, t)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {readinessBlockers.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {formatPackageAssembleBlockersCount(readinessBlockers.length, t)}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    {readinessBlockers.map((issue) => (
                      <div key={issue.code} className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                        <div className="font-medium text-sm">{issue.message}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep('allocate_coverage')}>
                      {getAssemblyBackLabel(t)}
                    </Button>
                    <Button
                      disabled={hasWeightMismatch || readinessBlockers.length > 0}
                      onClick={() => setCurrentStep('seal_shipment')}
                    >
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
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      {getPackageAssembleSealWarning(role, t)}
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{getPackageAssembleSelectedBatchesLabel(t)}</span>
                      <span className="font-medium">{selectedPackageIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{getPackageAssembleSealDeclaredWeightLabel(t)}</span>
                      <span className="font-medium">{declaredKg.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{getPackageAssembleLineageTotalLabel(t)}</span>
                      <span className="font-medium">{coveredQuantityKg.toLocaleString()} kg</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {firstSealFree ? getPackageAssembleFirstSealFreeHint(t) : getSealBillingHint(user?.active_role, t)}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-secondary/50">
                    <Checkbox
                      checked={liabilityAcknowledged}
                      onCheckedChange={(checked) => setLiabilityAcknowledged(checked === true)}
                      className="mt-1"
                      disabled={isAlreadySealed}
                    />
                    <label className="text-sm">
                      <div className="font-medium">{getPackageAssembleLiabilityTitle(t)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getPackageAssembleLiabilityBody(t)}
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={sealConfirmed}
                      onCheckedChange={(checked) => setSealConfirmed(checked === true)}
                      className="mt-1"
                      disabled={isAlreadySealed}
                    />
                    <label className="text-sm">{getPackageAssembleSealConfirmLabel(t)}</label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep('validate_issues')}>
                      {getAssemblyBackLabel(t)}
                    </Button>
                    <PermissionGate permission="packages:seal_shipment">
                      <Button
                        disabled={!canSeal || isSealing || isAlreadySealed}
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          setIsSealing(true);
                          try {
                            const header = await ensureShipmentHeader();
                            await sealCanonicalShipmentHeader(header.id);
                            toast.success(getPackageAssembleSealSuccessToast(t));
                            router.push('/compliance');
                          } catch (sealError) {
                            toast.error(
                              sealError instanceof Error
                                ? sealError.message
                                : getPackageAssembleSealErrorToast(t),
                            );
                          } finally {
                            setIsSealing(false);
                          }
                        }}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {getPackageAssembleSealCtaLabel(isSealing, t)}
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
