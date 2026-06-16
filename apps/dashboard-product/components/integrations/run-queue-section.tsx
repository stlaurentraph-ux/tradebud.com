'use client';

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SummaryCards } from './summary-cards';
import { RunQueueFiltersBar } from './run-queue-filters';
import { RunQueueTable } from './run-queue-table';
import { RunDetailsDrawer } from './run-details-drawer';
import { ConfirmationModal } from './confirmation-modal';
import { BulkReleaseModal } from './bulk-release-modal';
import type { IntegrationRun, RunSummary, RunQueueFilters } from '@/types/integrations';
import {
  claimRun,
  fetchRetryQueue,
  fetchRunSummary,
  releaseRun,
  releaseStaleClaims,
  retryRun,
} from '@/lib/integrations-v2-api';
import { LocaleContext } from '@/lib/locale-context';
import {
  getIntegrationsReleaseStaleLabel,
  getIntegrationsRunQueueLoadErrorLabel,
  getIntegrationsConfirmActionCopy,
  getIntegrationsToastMessage,
} from '@/lib/workflow-terminology-labels';

type ConfirmAction =
  | { type: 'claim'; run: IntegrationRun }
  | { type: 'release'; run: IntegrationRun; force: boolean }
  | { type: 'retry'; run: IntegrationRun };

export function RunQueueSection() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [isLoading, setIsLoading] = useState(true);
  const [runs, setRuns] = useState<IntegrationRun[]>([]);
  const [summary, setSummary] = useState<RunSummary>({
    startedCount: 0,
    completedCount: 0,
    failedCount: 0,
    staleClaimCount: 0,
    lastSweeperRun: null,
    lastSweeperReleasedCount: 0,
    lastSweeperTriggerSource: null,
    lastSweeperTokenVersion: null,
  });
  const [filters, setFilters] = useState<RunQueueFilters>({
    status: 'all',
    runType: 'all',
    claimStatus: 'all',
    dueNow: false,
    search: '',
  });

  // Drawer state
  const [selectedRun, setSelectedRun] = useState<IntegrationRun | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Bulk release modal state
  const [bulkReleaseOpen, setBulkReleaseOpen] = useState(false);
  const [isBulkReleaseLoading, setIsBulkReleaseLoading] = useState(false);

  const loadRunQueueData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryState, queueRuns] = await Promise.all([fetchRunSummary(), fetchRetryQueue(200)]);
      setSummary(summaryState);
      setRuns(queueRuns);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getIntegrationsRunQueueLoadErrorLabel(t));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load initial data
  useEffect(() => {
    void loadRunQueueData();
  }, [loadRunQueueData]);

  // Filter runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      // Status filter
      if (filters.status !== 'all' && run.status !== filters.status) {
        return false;
      }

      // Run type filter
      if (filters.runType !== 'all' && run.runType !== filters.runType) {
        return false;
      }

      // Claim status filter
      if (filters.claimStatus === 'claimed' && !run.claimedByUserId) {
        return false;
      }
      if (filters.claimStatus === 'unclaimed' && run.claimedByUserId) {
        return false;
      }

      // Due now filter
      if (filters.dueNow) {
        if (!run.nextRetryAt || new Date(run.nextRetryAt) > new Date()) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !run.id.toLowerCase().includes(searchLower) &&
          !run.questionnaireId.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [runs, filters]);

  // Handlers
  const handleViewDetails = useCallback((run: IntegrationRun) => {
    setSelectedRun(run);
    setDrawerOpen(true);
  }, []);

  const handleClaim = useCallback((run: IntegrationRun) => {
    setConfirmAction({ type: 'claim', run });
  }, []);

  const handleRelease = useCallback((run: IntegrationRun, force: boolean = false) => {
    setConfirmAction({ type: 'release', run, force });
  }, []);

  const handleRetry = useCallback((run: IntegrationRun) => {
    setConfirmAction({ type: 'retry', run });
  }, []);

  const executeAction = async () => {
    if (!confirmAction) return;

    setIsActionLoading(true);
    try {
      if (confirmAction.type === 'claim') {
        await claimRun(confirmAction.run.id);
        toast.success(
          getIntegrationsToastMessage('claimed', { runId: `${confirmAction.run.id.slice(0, 12)}...` }, t),
        );
      } else if (confirmAction.type === 'release') {
        await releaseRun(confirmAction.run.id, confirmAction.force);
        toast.success(
          getIntegrationsToastMessage(
            confirmAction.force ? 'force_released' : 'released',
            { runId: `${confirmAction.run.id.slice(0, 12)}...` },
            t,
          ),
        );
      } else if (confirmAction.type === 'retry') {
        await retryRun(confirmAction.run.id);
        toast.success(
          getIntegrationsToastMessage('retry', { runId: `${confirmAction.run.id.slice(0, 12)}...` }, t),
        );
      }
      await loadRunQueueData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getIntegrationsToastMessage('action_failed', undefined, t));
      return;
    } finally {
      setIsActionLoading(false);
    }
    setConfirmAction(null);
    setDrawerOpen(false);
  };

  const executeBulkRelease = async (staleMinutes: number, limit: number) => {
    setIsBulkReleaseLoading(true);
    try {
      const releasedCount = await releaseStaleClaims(staleMinutes, limit);
      toast.success(getIntegrationsToastMessage('bulk_released', { count: releasedCount }, t));
      await loadRunQueueData();
      setBulkReleaseOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : getIntegrationsToastMessage('bulk_release_failed', undefined, t),
      );
    } finally {
      setIsBulkReleaseLoading(false);
    }
  };

  // Confirmation modal content
  const getConfirmationContent = () => {
    if (!confirmAction) return { title: '', description: '', variant: 'default' as const, confirmLabel: '' };

    const runIdPrefix = `${confirmAction.run.id.slice(0, 12)}...`;
    if (confirmAction.type === 'claim') {
      return getIntegrationsConfirmActionCopy('claim', runIdPrefix, t);
    }
    if (confirmAction.type === 'release') {
      return confirmAction.force
        ? getIntegrationsConfirmActionCopy('force_release', runIdPrefix, t)
        : getIntegrationsConfirmActionCopy('release', runIdPrefix, t);
    }
    return getIntegrationsConfirmActionCopy('retry', runIdPrefix, t);
  };

  const confirmContent = getConfirmationContent();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <RunQueueFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={runs.length}
            filteredCount={filteredRuns.length}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkReleaseOpen(true)}
          disabled={summary.staleClaimCount === 0}
          className="flex-shrink-0"
        >
          <Clock className="mr-1.5 h-4 w-4" />
          {getIntegrationsReleaseStaleLabel(summary.staleClaimCount, t)}
        </Button>
      </div>

      {/* Runs Table */}
      <RunQueueTable
        runs={filteredRuns}
        onViewDetails={handleViewDetails}
        onClaim={handleClaim}
        onRelease={handleRelease}
        onRetry={handleRetry}
        isLoading={isLoading}
      />

      {/* Run Details Drawer */}
      <RunDetailsDrawer
        run={selectedRun}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClaim={handleClaim}
        onRelease={handleRelease}
        onRetry={handleRetry}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmContent.title}
        description={confirmContent.description}
        confirmLabel={confirmContent.confirmLabel}
        variant={confirmContent.variant}
        isLoading={isActionLoading}
        onConfirm={executeAction}
      />

      {/* Bulk Release Modal */}
      <BulkReleaseModal
        open={bulkReleaseOpen}
        onOpenChange={setBulkReleaseOpen}
        staleCount={summary.staleClaimCount}
        defaultStaleMinutes={60}
        defaultLimit={100}
        isLoading={isBulkReleaseLoading}
        onConfirm={executeBulkRelease}
      />
    </div>
  );
}
