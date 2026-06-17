'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Scale, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ExporterBatchRecord } from '@/lib/exporter-batch-store';
import {
  calculateHarvestYieldCap,
  HarvestBatchStatusBadge,
  harvestBatchCapacityUtilizationPct,
} from '@/components/harvests/harvest-batch-status-badge';
import {
  getHarvestDetailCapacityLabel,
  getHarvestDetailExceptionLabel,
  getHarvestDetailExpectedYieldLabel,
  getHarvestDetailNotFoundBody,
  getHarvestDetailNotFoundTitle,
  getHarvestDetailPlotAreaLabel,
  getHarvestDetailPlotLabel,
  getHarvestDetailRecordedLabel,
  getHarvestDetailUtilizationLabel,
  getHarvestDetailWeightLabel,
  getHarvestDetailYieldCapLabel,
  getHarvestOriginColumnLabel,
} from '@/lib/workflow-terminology-labels';
import type { User as AuthUser } from '@/types';

interface HarvestBatchDetailViewProps {
  batch: ExporterBatchRecord;
  role: AuthUser['active_role'] | undefined;
  t?: (key: string) => string;
}

function formatExceptionStatus(
  status: ExporterBatchRecord['exception_status'],
  t?: (key: string) => string,
): string | null {
  if (!status || status === 'none') return null;
  return getHarvestDetailExceptionLabel(status, t);
}

export function HarvestBatchDetailView({ batch, role, t }: HarvestBatchDetailViewProps) {
  const capacityKg = calculateHarvestYieldCap(batch.plot_area_hectares, batch.expected_yield_kg_per_ha);
  const utilizationPct = harvestBatchCapacityUtilizationPct(batch.weight_kg, capacityKg);
  const exceptionLabel = formatExceptionStatus(batch.exception_status, t);
  const plotHref = batch.plot_id ? `/plots/${encodeURIComponent(batch.plot_id)}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <HarvestBatchStatusBadge status={batch.status} />
        {exceptionLabel ? (
          <span className="text-sm text-muted-foreground">{exceptionLabel}</span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getHarvestDetailPlotLabel(t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                {plotHref ? (
                  <Link href={plotHref} className="font-medium text-primary hover:underline">
                    {batch.plot_name}
                  </Link>
                ) : (
                  <p className="font-medium">{batch.plot_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {getHarvestDetailPlotAreaLabel(t)}: {batch.plot_area_hectares.toFixed(2)} ha
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">{getHarvestOriginColumnLabel(role, t)}</p>
                <p className="font-medium">{batch.farmer_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getHarvestDetailWeightLabel(t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <dt className="text-xs text-muted-foreground">{getHarvestDetailWeightLabel(t)}</dt>
                  <dd className="font-semibold">{batch.weight_kg.toLocaleString()} kg</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{getHarvestDetailYieldCapLabel(t)}</dt>
                  <dd className="font-medium">{capacityKg.toLocaleString()} kg</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{getHarvestDetailUtilizationLabel(t)}</dt>
                  <dd className="font-medium">
                    {utilizationPct == null ? '—' : `${utilizationPct}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{getHarvestDetailExpectedYieldLabel(t)}</dt>
                  <dd className="font-medium">{batch.expected_yield_kg_per_ha.toLocaleString()} kg/ha</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{getHarvestDetailCapacityLabel(t)}</dt>
                  <dd className="text-muted-foreground">
                    {batch.plot_area_hectares.toFixed(2)} ha × {batch.expected_yield_kg_per_ha.toLocaleString()} kg/ha
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{getHarvestDetailRecordedLabel(t)}</p>
            <p className="font-medium">{new Date(batch.date).toLocaleString()}</p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">ID {batch.id}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function HarvestBatchNotFound({ t }: { t?: (key: string) => string }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">{getHarvestDetailNotFoundTitle(t)}</p>
        <p className="text-sm text-muted-foreground">{getHarvestDetailNotFoundBody(t)}</p>
        <Button variant="outline" asChild>
          <Link href="/harvests">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to batches
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
