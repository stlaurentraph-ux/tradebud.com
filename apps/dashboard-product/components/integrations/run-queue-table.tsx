'use client';

import { useState, useContext, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Hand,
  Unlock,
  RotateCcw,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrationRun, RunStatus, RunType } from '@/types/integrations';
import { LocaleContext } from '@/lib/locale-context';
import {
  getIntegrationsActionLabel,
  getIntegrationsDueBadgeLabel,
  getIntegrationsRunStatusLabel,
  getIntegrationsTableColumnLabel,
  getIntegrationsTableEmptyDescription,
  getIntegrationsTableEmptyTitle,
  getIntegrationsTableLoadingLabel,
} from '@/lib/workflow-terminology-labels';

interface RunQueueTableProps {
  runs: IntegrationRun[];
  onViewDetails: (run: IntegrationRun) => void;
  onClaim: (run: IntegrationRun) => void;
  onRelease: (run: IntegrationRun, force?: boolean) => void;
  onRetry: (run: IntegrationRun) => void;
  isLoading?: boolean;
}

type SortField = 'updatedAt' | 'status' | 'attemptCount' | 'nextRetryAt';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  children: ReactNode;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function StatusBadge({ status, t }: { status: RunStatus; t?: (key: string) => string }) {
  const variants: Record<RunStatus, 'info' | 'success' | 'destructive'> = {
    started: 'info',
    completed: 'success',
    failed: 'destructive',
  };
  return <Badge variant={variants[status]}>{getIntegrationsRunStatusLabel(status, t)}</Badge>;
}

function TypeBadge({ type }: { type: RunType }) {
  return (
    <Badge variant="outline" className="font-mono text-xs">
      {type}
    </Badge>
  );
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isRetryDue(nextRetryAt: string | null): boolean {
  if (!nextRetryAt) return false;
  return new Date(nextRetryAt) <= new Date();
}

function isClaimStale(claimedAt: string | null, staleMinutes = 60): boolean {
  if (!claimedAt) return false;
  const claimTime = new Date(claimedAt).getTime();
  const now = Date.now();
  return now - claimTime > staleMinutes * 60 * 1000;
}

function formatClaimedBy(userId: string): string {
  return userId.length > 12 ? `${userId.slice(0, 12)}...` : userId;
}

function SortHeader({ field, children, sortField, sortDirection, onSort }: SortHeaderProps) {
  const isActive = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {isActive ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}

export function RunQueueTable({
  runs,
  onViewDetails,
  onClaim,
  onRelease,
  onRetry,
  isLoading,
}: RunQueueTableProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRuns = [...runs].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'attemptCount':
        comparison = a.attemptCount - b.attemptCount;
        break;
      case 'nextRetryAt':
        const aTime = a.nextRetryAt ? new Date(a.nextRetryAt).getTime() : Infinity;
        const bTime = b.nextRetryAt ? new Date(b.nextRetryAt).getTime() : Infinity;
        comparison = aTime - bTime;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Can claim if: failed, unclaimed, retry is due
  const canClaim = (run: IntegrationRun) =>
    run.status === 'failed' && !run.claimedByUserId && isRetryDue(run.nextRetryAt);

  // Can release if: claimed (regardless of status for force release)
  const canRelease = (run: IntegrationRun) => !!run.claimedByUserId;

  // Can retry if: failed
  const canRetry = (run: IntegrationRun) => run.status === 'failed';

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">{getIntegrationsTableLoadingLabel(t)}</p>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Eye className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground">{getIntegrationsTableEmptyTitle(t)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getIntegrationsTableEmptyDescription(t)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="table-responsive">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px]">{getIntegrationsTableColumnLabel('run_id', t)}</TableHead>
              <TableHead>{getIntegrationsTableColumnLabel('questionnaire', t)}</TableHead>
              <TableHead>{getIntegrationsTableColumnLabel('type', t)}</TableHead>
              <TableHead>
                <SortHeader field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{getIntegrationsTableColumnLabel('status', t)}</SortHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortHeader field="attemptCount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{getIntegrationsTableColumnLabel('attempts', t)}</SortHeader>
              </TableHead>
              <TableHead>{getIntegrationsTableColumnLabel('error_code', t)}</TableHead>
              <TableHead>
                <SortHeader field="nextRetryAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{getIntegrationsTableColumnLabel('next_retry', t)}</SortHeader>
              </TableHead>
              <TableHead>{getIntegrationsTableColumnLabel('claimed_by', t)}</TableHead>
              <TableHead>
                <SortHeader field="updatedAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{getIntegrationsTableColumnLabel('updated', t)}</SortHeader>
              </TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">{getIntegrationsTableColumnLabel('actions', t)}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRuns.map((run) => {
              const stale = isClaimStale(run.claimedAt);
              const due = isRetryDue(run.nextRetryAt);

              return (
                <TableRow
                  key={run.id}
                  className={cn(
                    'cursor-pointer',
                    stale && 'bg-amber-50/50'
                  )}
                  onClick={() => onViewDetails(run)}
                >
                  <TableCell className="font-mono text-xs">
                    <span className="truncate-responsive">{run.id.slice(0, 12)}...</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {run.questionnaireId}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={run.runType} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} t={t} />
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {run.attemptCount}
                  </TableCell>
                  <TableCell>
                    {run.errorCode ? (
                      <span className="font-mono text-xs text-destructive">
                        {run.errorCode}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {run.nextRetryAt ? (
                      <span
                        className={cn(
                          'text-xs',
                          due && 'font-medium text-amber-600'
                        )}
                      >
                        {formatTimestamp(run.nextRetryAt)}
                        {due && (
                          <Badge variant="warning" className="ml-2 text-[10px] px-1 py-0">
                            {getIntegrationsDueBadgeLabel(t)}
                          </Badge>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {run.claimedByUserId ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{formatClaimedBy(run.claimedByUserId)}</span>
                        {stale && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(run.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{getIntegrationsTableColumnLabel('actions', t)}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(run);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {getIntegrationsActionLabel('view_details', t)}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onClaim(run);
                          }}
                          disabled={!canClaim(run)}
                        >
                          <Hand className="mr-2 h-4 w-4" />
                          {getIntegrationsActionLabel('claim', t)}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onRelease(run, false);
                          }}
                          disabled={!canRelease(run)}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          {getIntegrationsActionLabel('release', t)}
                        </DropdownMenuItem>
                        {canRelease(run) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRelease(run, true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Unlock className="mr-2 h-4 w-4" />
                            {getIntegrationsActionLabel('force_release', t)}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(run);
                          }}
                          disabled={!canRetry(run)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {getIntegrationsActionLabel('retry', t)}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
