'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCanCreateHarvestBatch } from '@/components/common/harvest-batch-create-gate';
import { useAuth } from '@/lib/auth-context';
import { useCommercialProfile } from '@/lib/use-commercial-profile';
import { LocaleContext } from '@/lib/locale-context';
import { deriveBatchStatus } from '@/lib/exporter-batch-store';
import { recordBatchIntake } from '@/lib/batch-intake-service';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBatchPageTitle,
  getHarvestNewBreadcrumbLabel,
  getHarvestNewCardDescription,
  getHarvestNewCardTitle,
  getHarvestNewIntakeAlert,
  getHarvestNewPageSubtitle,
  getHarvestNewPageTitle,
  getHarvestOriginFieldLabel,
  getHarvestRecordSubmitLabel,
  getHarvestRecordSuccessToast,
} from '@/lib/workflow-terminology-labels';

const DEFAULT_EXPECTED_YIELD = 700;

export default function NewHarvestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: isProfileLoading } = useCommercialProfile();
  const canCreateHarvestBatch = useCanCreateHarvestBatch();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const batchPageTitle = useMemo(() => getBatchPageTitle(role, t), [role, t]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    batchId: '',
    plotId: '',
    plotName: '',
    plotAreaHa: '',
    producerName: '',
    weightKg: '',
    expectedYieldKgPerHa: String(DEFAULT_EXPECTED_YIELD),
    harvestDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const previewStatus = useMemo(() => {
    const area = Number(form.plotAreaHa);
    const weight = Number(form.weightKg);
    const expectedYield = Number(form.expectedYieldKgPerHa) || DEFAULT_EXPECTED_YIELD;
    if (!Number.isFinite(area) || !Number.isFinite(weight) || area <= 0 || weight <= 0) {
      return null;
    }
    return deriveBatchStatus(weight, area, expectedYield);
  }, [form.plotAreaHa, form.weightKg, form.expectedYieldKgPerHa]);

  useEffect(() => {
    if (isProfileLoading) return;
    if (!canCreateHarvestBatch) {
      router.replace('/harvests');
    }
  }, [canCreateHarvestBatch, isProfileLoading, router]);

  if (isProfileLoading || !canCreateHarvestBatch) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    if (!user?.tenant_id) {
      setError('Missing tenant context. Please sign in again.');
      return;
    }

    const plotArea = Number(form.plotAreaHa);
    const weightKg = Number(form.weightKg);
    const expectedYield = Number(form.expectedYieldKgPerHa) || DEFAULT_EXPECTED_YIELD;

    if (!form.plotName.trim() || !form.producerName.trim()) {
      setError(`Plot name and ${getHarvestOriginFieldLabel(role, t).toLowerCase()} name are required.`);
      return;
    }
    if (!Number.isFinite(plotArea) || plotArea <= 0) {
      setError('Plot area must be greater than zero.');
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError('Weight must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const status = deriveBatchStatus(weightKg, plotArea, expectedYield);
      const result = await recordBatchIntake(user.tenant_id, {
        id: `batch_${Date.now()}`,
        batch_id: form.batchId.trim() || `BATCH-${Date.now()}`,
        plot_id: form.plotId.trim() || `plot_${Date.now()}`,
        plot_name: form.plotName.trim(),
        plot_area_hectares: plotArea,
        farmer_name: form.producerName.trim(),
        weight_kg: weightKg,
        expected_yield_kg_per_ha: expectedYield,
        date: new Date(form.harvestDate).toISOString(),
        status,
      });

      toast.success(getHarvestRecordSuccessToast(result.persistedRemotely, t));
      router.push('/harvests');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to record batch input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getHarvestNewPageTitle(role, t)}
        subtitle={getHarvestNewPageSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: batchPageTitle, href: '/harvests' },
          { label: getHarvestNewBreadcrumbLabel(t) },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/harvests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {batchPageTitle}
          </Link>
        </Button>

        <div className="mx-auto max-w-2xl space-y-4">
          <Alert>
            <AlertDescription>{getHarvestNewIntakeAlert(role, t)}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>{getHarvestNewCardTitle(role, t)}</CardTitle>
              <CardDescription>{getHarvestNewCardDescription(role, t)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch ID (optional)</Label>
                  <Input
                    id="batchId"
                    value={form.batchId}
                    onChange={(event) => setForm((previous) => ({ ...previous, batchId: event.target.value }))}
                    placeholder="Auto-generated if blank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Intake date</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={form.harvestDate}
                    onChange={(event) => setForm((previous) => ({ ...previous, harvestDate: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plotName">Plot name</Label>
                  <Input
                    id="plotName"
                    value={form.plotName}
                    onChange={(event) => setForm((previous) => ({ ...previous, plotName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plotAreaHa">Plot area (ha)</Label>
                  <Input
                    id="plotAreaHa"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.plotAreaHa}
                    onChange={(event) => setForm((previous) => ({ ...previous, plotAreaHa: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="producerName">{getHarvestOriginFieldLabel(role, t)} name</Label>
                <Input
                  id="producerName"
                  value={form.producerName}
                  onChange={(event) => setForm((previous) => ({ ...previous, producerName: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={(event) => setForm((previous) => ({ ...previous, weightKg: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedYield">Expected yield (kg/ha)</Label>
                  <Input
                    id="expectedYield"
                    type="number"
                    min="0"
                    value={form.expectedYieldKgPerHa}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, expectedYieldKgPerHa: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Notes (optional)</Label>
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
                  rows={3}
                />
              </div>

              {previewStatus ? (
                <p className="text-sm text-muted-foreground">
                  Yield check preview: <span className="font-medium capitalize">{previewStatus}</span>
                </p>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button onClick={() => void handleSubmit()} disabled={isSubmitting} className="w-full">
                {getHarvestRecordSubmitLabel(isSubmitting, t)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
