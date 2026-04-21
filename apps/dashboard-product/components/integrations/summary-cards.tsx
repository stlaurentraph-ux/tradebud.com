'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RunSummary } from '@/types/integrations';

interface SummaryCardsProps {
  summary: RunSummary;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  isLoading?: boolean;
}

function StatCard({ label, value, icon, variant = 'default', isLoading }: StatCardProps) {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    destructive: 'text-red-600',
    info: 'text-blue-600',
  };

  const iconBgStyles = {
    default: 'bg-muted',
    success: 'bg-emerald-100',
    warning: 'bg-amber-100',
    destructive: 'bg-red-100',
    info: 'bg-blue-100',
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            iconBgStyles[variant]
          )}
        >
          <span className={cn(variantStyles[variant])}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-1 h-7 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className={cn('text-2xl font-semibold tabular-nums', variantStyles[variant])}>
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Started"
        value={summary.startedCount}
        icon={<Play className="h-5 w-5" />}
        variant="info"
        isLoading={isLoading}
      />
      <StatCard
        label="Completed"
        value={summary.completedCount}
        icon={<CheckCircle2 className="h-5 w-5" />}
        variant="success"
        isLoading={isLoading}
      />
      <StatCard
        label="Failed"
        value={summary.failedCount}
        icon={<XCircle className="h-5 w-5" />}
        variant="destructive"
        isLoading={isLoading}
      />
      <StatCard
        label="Stale Claims"
        value={summary.staleClaimCount}
        icon={<Clock className="h-5 w-5" />}
        variant="warning"
        isLoading={isLoading}
      />

      {/* Last Sweeper Run Card */}
      <Card className="border-border bg-card col-span-2 lg:col-span-1">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Last Sweeper
              </p>
              {isLoading ? (
                <div className="mt-1 space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {formatTimestamp(summary.lastSweeperRun)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {summary.lastSweeperTriggerSource && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {summary.lastSweeperTriggerSource}
                      </Badge>
                    )}
                    {summary.lastSweeperReleasedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {summary.lastSweeperReleasedCount} released
                      </Badge>
                    )}
                    {summary.lastSweeperTokenVersion && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {summary.lastSweeperTokenVersion}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
