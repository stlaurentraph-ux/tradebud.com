'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGate } from '@/components/common/permission-gate';
import { getPackageById, getMockHarvests } from '@/lib/mock-data';

interface AssemblePageProps {
  params: Promise<{ id: string }>;
}

type StepType = 'select_batches' | 'allocate_coverage' | 'validate_issues' | 'seal_shipment';

export default function AssembleShipmentPage({ params }: AssemblePageProps) {
  const { id } = use(params);
  const pkg = getPackageById(id);
  const harvests = getMockHarvests();

  if (!pkg) {
    notFound();
  }

  const [currentStep, setCurrentStep] = useState<StepType>('select_batches');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false);
  const [sealConfirmed, setSealConfirmed] = useState(false);

  // Mock blocking issues
  const blockingIssues = [
    {
      id: 'issue_001',
      severity: 'BLOCKING',
      title: 'Missing FPIC documentation',
      description: 'Plot plot_003 lacks required Free Prior and Informed Consent documentation',
      plotId: 'plot_003',
    },
  ];

  const eligibleBatches = harvests.filter((h) => h.status === 'harvested' || h.status === 'pending_yield_check');
  const selectedBatchDetails = harvests.filter((h) => selectedBatches.includes(h.id));
  const totalQuantity = selectedBatchDetails.reduce((sum, b) => sum + b.quantity_kg, 0);

  const canProceedToAllocate = selectedBatches.length > 0;
  const canProceedToValidate = canProceedToAllocate;
  const canSeal = blockingIssues.length === 0 && liabilityAcknowledged;

  const steps = [
    {
      id: 'select_batches',
      label: 'Select Batches',
      description: 'Choose harvests to include',
    },
    {
      id: 'allocate_coverage',
      label: 'Allocate Coverage',
      description: 'Assign to shipment lines',
    },
    {
      id: 'validate_issues',
      label: 'Validate Issues',
      description: 'Check blocking conditions',
    },
    {
      id: 'seal_shipment',
      label: 'Seal Shipment',
      description: 'Finalize and submit',
    },
  ];

  return (
    <div className="flex flex-col">
      <AppHeader
        title={`Assemble Shipment - ${pkg.code}`}
        subtitle="4-Step Workflow"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Packages', href: '/packages' },
          { label: pkg.code, href: `/packages/${pkg.id}` },
          { label: 'Assemble Shipment' },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={`/packages/${pkg.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Package
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Step Navigator */}
          <div className="space-y-2 lg:col-span-1">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id === 'select_batches') setCurrentStep(step.id as StepType);
                  else if (step.id === 'allocate_coverage' && canProceedToAllocate) setCurrentStep(step.id as StepType);
                  else if (step.id === 'validate_issues' && canProceedToValidate) setCurrentStep(step.id as StepType);
                  else if (step.id === 'seal_shipment' && canSeal) setCurrentStep(step.id as StepType);
                }}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  currentStep === step.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-secondary/50'
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

          {/* Step Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* STEP 1: Select Batches */}
            {currentStep === 'select_batches' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Select Eligible Batches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select harvests that have passed yield checks or are pending approval. 
                    Total quantity will be calculated for shipment allocation.
                  </p>

                  {eligibleBatches.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No eligible batches found. Create harvests first.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {eligibleBatches.map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-start gap-3 rounded-lg border border-border p-3"
                        >
                          <Checkbox
                            checked={selectedBatches.includes(batch.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBatches([...selectedBatches, batch.id]);
                              } else {
                                setSelectedBatches(selectedBatches.filter((id) => id !== batch.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{batch.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {batch.quantity_kg.toLocaleString()} kg • {batch.yield_check_status}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{batch.quantity_kg.toLocaleString()} kg</div>
                            <div className="text-xs text-muted-foreground">{new Date(batch.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBatches.length > 0 && (
                    <Card className="bg-secondary/50 border-border">
                      <CardContent className="pt-4">
                        <div className="text-sm">
                          <div className="text-muted-foreground">Total Selected</div>
                          <div className="text-lg font-semibold">{totalQuantity.toLocaleString()} kg</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/packages/${pkg.id}`}>Cancel</Link>
                    </Button>
                    <Button disabled={!canProceedToAllocate} onClick={() => setCurrentStep('allocate_coverage')}>
                      Next: Allocate Coverage
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Allocate Coverage */}
            {currentStep === 'allocate_coverage' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Allocate Coverage to Shipment Lines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Distribute the selected batch quantity across shipment lines. 
                    Each line tracks coverage with plots and farmers.
                  </p>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Total quantity: {totalQuantity.toLocaleString()} kg will be split across lines.
                      Ensure allocations match plot area and expected yield.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <div className="font-medium text-sm mb-2">Shipment Line 1</div>
                      <div className="text-xs text-muted-foreground">
                        Plots: plot_001, plot_002 • Coverage: {Math.floor(totalQuantity * 0.6).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="font-medium text-sm mb-2">Shipment Line 2</div>
                      <div className="text-xs text-muted-foreground">
                        Plots: plot_003 • Coverage: {Math.floor(totalQuantity * 0.4).toLocaleString()} kg
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
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

            {/* STEP 3: Validate Issues */}
            {currentStep === 'validate_issues' && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Validate Role Classification & Blocking Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Review all blocking conditions. No shipment can be sealed if blocking issues exist.
                  </p>

                  {blockingIssues.length > 0 ? (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-700">
                        {blockingIssues.length} blocking issue(s) found. Resolve before sealing.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">
                        No blocking issues detected. Ready to seal shipment.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    {blockingIssues.map((issue) => (
                      <div key={issue.id} className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{issue.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{issue.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep('allocate_coverage')}>
                      Back
                    </Button>
                    <Button disabled={blockingIssues.length > 0} onClick={() => setCurrentStep('seal_shipment')}>
                      Next: Seal Shipment
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: Seal Shipment */}
            {currentStep === 'seal_shipment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Step 4: Seal Shipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Sealing this shipment is a binding action. You will assume operator liability 
                      for the accuracy and completeness of the data herein.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="text-sm">
                      <div className="text-muted-foreground">Shipment Summary</div>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span>Selected batches</span>
                          <span className="font-medium">{selectedBatches.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total quantity</span>
                          <span className="font-medium">{totalQuantity.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipment lines</span>
                          <span className="font-medium">2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-secondary/50">
                    <Checkbox
                      checked={liabilityAcknowledged}
                      onCheckedChange={(checked) => setLiabilityAcknowledged(checked as boolean)}
                      className="mt-1"
                    />
                    <label className="text-sm cursor-pointer">
                      <div className="font-medium">I acknowledge operator liability</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        I confirm that all data in this shipment is accurate, complete, and compliant 
                        with EUDR requirements. I assume full responsibility for any inaccuracies.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={sealConfirmed}
                      onCheckedChange={(checked) => setSealConfirmed(checked as boolean)}
                      className="mt-1"
                    />
                    <label className="text-sm cursor-pointer">
                      I confirm I want to seal this shipment now
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep('validate_issues')}>
                      Back
                    </Button>
                    <PermissionGate permission="packages:seal_shipment">
                      <Button
                        disabled={!canSeal || !sealConfirmed}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Seal & Finalize Shipment
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
