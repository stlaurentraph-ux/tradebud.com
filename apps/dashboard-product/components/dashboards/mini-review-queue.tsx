'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/status-chip';
import { useAuth } from '@/lib/auth-context';
import { resolveHarvestPackageScope } from '@/lib/harvest-package-scope';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { LocaleContext } from '@/lib/locale-context';
import {
  buildMiniReviewQueue,
  formatReviewQueuePlotCount,
  formatReviewQueueRelativeAge,
  getMiniReviewQueueCopy,
  getReviewQueueBlockedLabel,
  getReviewQueueLoadErrorPrefix,
  getReviewQueueRiskLabel,
  type ReviewQueueRisk,
} from '@/lib/compliance-review-queue';
import type { DDSPackage, TenantRole } from '@/types';
import { cn } from '@/lib/utils';

interface MiniReviewQueueProps {
  role: Extract<TenantRole, 'importer' | 'country_reviewer'>;
  maxItems?: number;
  prefetchedPackages?: DDSPackage[];
  prefetchedLoading?: boolean;
  prefetchedError?: string | null;
}

const RISK_BADGE: Record<ReviewQueueRisk, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function MiniReviewQueue({
  role,
  maxItems = 5,
  prefetchedPackages,
  prefetchedLoading,
  prefetchedError,
}: MiniReviewQueueProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const scope = resolveHarvestPackageScope(role);
  const useLivePackages = prefetchedPackages === undefined;
  const {
    packages: livePackages,
    isLoading: liveLoading,
    error: liveError,
  } = useHarvestPackages(user?.tenant_id ?? null, { scope, enabled: useLivePackages });
  const packages = prefetchedPackages ?? livePackages;
  const isLoading = prefetchedPackages !== undefined ? Boolean(prefetchedLoading) : liveLoading;
  const error = prefetchedPackages !== undefined ? prefetchedError ?? null : liveError;
  const copy = getMiniReviewQueueCopy(role, t);
  const items = buildMiniReviewQueue(packages, role, maxItems, t);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={copy.viewAllHref}>
            {copy.viewAllLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : null}

        {!isLoading && error ? (
          <p className="text-sm text-amber-700">
            {getReviewQueueLoadErrorPrefix(t)} {error}
          </p>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="font-medium">{copy.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.emptyDescription}</p>
            <Button asChild size="sm" className="mt-4">
              <Link href={copy.emptyCtaHref}>{copy.emptyCtaLabel}</Link>
            </Button>
          </div>
        ) : null}

        {!isLoading && !error
          ? items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.code}</p>
                    <StatusChip status={item.status} role={role} size="sm" />
                    <Badge variant="outline" className={cn(RISK_BADGE[item.riskLevel])}>
                      {getReviewQueueRiskLabel(item.riskLevel, t)}
                    </Badge>
                    {item.complianceStatus === 'BLOCKED' ? (
                      <Badge variant="destructive">{getReviewQueueBlockedLabel(t)}</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{item.supplierName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatReviewQueueRelativeAge(item.updatedAt, t)} ·{' '}
                    {formatReviewQueuePlotCount(item.plotsCount, t)}
                  </p>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={item.actionHref}>{item.actionLabel}</Link>
                </Button>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}
