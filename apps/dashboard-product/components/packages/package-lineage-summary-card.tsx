'use client';

import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildPackageLineageSummary } from '@/lib/package-lineage-summary';
import {
  getPackageLineageStatusMessage,
  getPackageLineageSummaryCopy,
} from '@/lib/package-lineage-summary-copy';
import type { DDSPackage } from '@/types';
import { cn } from '@/lib/utils';

interface PackageLineageSummaryCardProps {
  pkg: DDSPackage;
  t?: (key: string) => string;
}

export function PackageLineageSummaryCard({ pkg, t }: PackageLineageSummaryCardProps) {
  const summary = buildPackageLineageSummary(pkg);
  const statusMessage = getPackageLineageStatusMessage(summary, t);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <GitBranch className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          {getPackageLineageSummaryCopy('title', t)}
        </CardTitle>
        <CardDescription>{getPackageLineageSummaryCopy('description', t)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {getPackageLineageSummaryCopy('flow_label', t)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-lg font-semibold">{summary.producerCount}</p>
            <p className="text-xs text-muted-foreground">
              {getPackageLineageSummaryCopy('producers', t, { count: summary.producerCount })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-lg font-semibold">{summary.plotCount}</p>
            <p className="text-xs text-muted-foreground">
              {getPackageLineageSummaryCopy('plots', t, { count: summary.plotCount })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-lg font-semibold">
              {summary.weightKg > 0 ? summary.weightKg.toLocaleString() : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {getPackageLineageSummaryCopy('weight', t, { kg: summary.weightKg.toLocaleString() })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-lg font-semibold">{summary.totalHectares.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">
              {getPackageLineageSummaryCopy('hectares', t, { ha: summary.totalHectares.toFixed(1) })}
            </p>
          </div>
        </div>
        <p
          className={cn(
            'rounded-lg border p-3 text-sm',
            summary.isIntact
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900',
          )}
        >
          {statusMessage}
          {summary.isIntact && summary.verifiedPlotCount < summary.plotCount ? (
            <span className="mt-1 block text-xs opacity-90">
              {getPackageLineageSummaryCopy('verified_plots', t, {
                count: summary.verifiedPlotCount,
              })}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
