'use client';

import { useMemo, useState } from 'react';
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
import { useAuth } from '@/lib/auth-context';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { deriveBatchStatus } from '@/lib/exporter-batch-store';
import { recordBatchIntake } from '@/lib/batch-intake-service';

const DEFAULT_EXPECTED_YIELD = 700;

export default function NewHarvestPage() {
  const router = useRouter();
  const { user } = useAuth();
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
      setError('Plot name and producer name are required.');
      return;
    }
    if (!Number.isFinite(plotArea) || plotArea <= 0) {
      setError('Plot area must be greater than zero.');
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError('Batch weight must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const batchId =
        form.batchId.trim() ||
        `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const record = {
        id: `batch_${Date.now()}`,
        batch_id: batchId,
        plot_id: form.plotId.trim() || `plot_${Date.now()}`,
        plot_name: form.plotName.trim(),
        plot_area_hectares: plotArea,
        farmer_name: form.producerName.trim(),
        weight_kg: weightKg,
        expected_yield_kg_per_ha: expectedYield,
        date: new Date(form.harvestDate).toISOString(),
        status: deriveBatchStatus(weightKg, plotArea, expectedYield),
        exception_status: 'none' as const,
      };

      const result = await recordBatchIntake(user.tenant_id, record);
      markOnboardingAction('first_submission_synced');
      toast.success(
        result.persistedRemotely
          ? 'Batch input recorded and synced to your workspace audit trail'
          : 'Batch input recorded locally (backend sync unavailable)',
      );
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
        title="Record Batch Input"
        subtitle="Capture aggregation weight against plot yield capacity for exporter lot and batch tracking"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Lots & Batches', href: '/harvests' },
          { label: 'New' },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/harvests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lots & Batches
          </Link>
        </Button>

        <div className="mx-auto max-w-2xl space-y-4">
          <Alert>
            <AlertDescription>
              Batch inputs are stored in your workspace audit trail when the backend is available, with
              a local fallback for offline yield checks. Field teams can later sync authoritative harvest vouchers from mobile capture.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Batch intake details</CardTitle>
              <CardDescription>
                Enter plot, producer, and weight data to validate capacity before shipment assembly.
              </CardDescription>
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
                    placeholder="Nyota Block A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plotId">Plot reference (optional)</Label>
                  <Input
                    id="plotId"
                    value={form.plotId}
                    onChange={(event) => setForm((previous) => ({ ...previous, plotId: event.target.value }))}
                    placeholder="plot_117"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="producerName">Producer</Label>
                  <Input
                    id="producerName"
                    value={form.producerName}
                    onChange={(event) => setForm((previous) => ({ ...previous, producerName: event.target.value }))}
                    placeholder="Producer name"
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
                    placeholder="1.8"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Batch weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    min="0"
                    step="1"
                    value={form.weightKg}
                    onChange={(event) => setForm((previous) => ({ ...previous, weightKg: event.target.value }))}
                    placeholder="1280"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedYieldKgPerHa">Expected yield (kg/ha)</Label>
                  <Input
                    id="expectedYieldKgPerHa"
                    type="number"
                    min="0"
                    step="1"
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
                  placeholder="Source lot reference, delivery truck, or collection campaign context"
                  rows={3}
                />
              </div>

              {previewStatus ? (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  Yield check preview:{' '}
                  <span className="font-medium capitalize">
                    {previewStatus === 'pass' ? 'within capacity' : previewStatus}
                  </span>
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/harvests">Cancel</Link>
                </Button>
                <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Record batch input'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
