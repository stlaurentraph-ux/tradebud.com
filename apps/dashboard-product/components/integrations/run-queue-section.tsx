'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { generateMockRuns, getMockSummary } from '@/lib/integrations-mock-data';

type ConfirmAction =
  | { type: 'claim'; run: IntegrationRun }
  | { type: 'release'; run: IntegrationRun; force: boolean }
  | { type: 'retry'; run: IntegrationRun };

export function RunQueueSection() {
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

  // Load initial data
  useEffect(() => {
    // TODO: Replace with actual API calls
    // GET /v1/integrations/coolfarm-sai/v2/runs/summary
    // GET /v1/integrations/coolfarm-sai/v2/runs/retry-queue
    const timer = setTimeout(() => {
      setRuns(generateMockRuns());
      setSummary(getMockSummary());
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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

    // TODO: Replace with actual API calls
    // POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/claim
    // POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/release
    // POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/retry

    await new Promise((resolve) => setTimeout(resolve, 1000));

    switch (confirmAction.type) {
      case 'claim':
        toast.success(`Claimed run ${confirmAction.run.id.slice(0, 12)}...`);
        // Update local state to reflect the claim
        setRuns((prev) =>
          prev.map((r) =>
            r.id === confirmAction.run.id
              ? { ...r, claimedByUserId: 'current_user', claimedAt: new Date().toISOString() }
              : r
          )
        );
        break;
      case 'release':
        toast.success(
          `${confirmAction.force ? 'Force released' : 'Released'} run ${confirmAction.run.id.slice(0, 12)}...`
        );
        setRuns((prev) =>
          prev.map((r) =>
            r.id === confirmAction.run.id
              ? { ...r, claimedByUserId: null, claimedAt: null }
              : r
          )
        );
        break;
      case 'retry':
        toast.success(`Retry initiated for run ${confirmAction.run.id.slice(0, 12)}...`);
        setRuns((prev) =>
          prev.map((r) =>
            r.id === confirmAction.run.id
              ? { ...r, attemptCount: r.attemptCount + 1, status: 'started' as const }
              : r
          )
        );
        break;
    }

    setIsActionLoading(false);
    setConfirmAction(null);
    setDrawerOpen(false);
  };

  const executeBulkRelease = async (staleMinutes: number, limit: number) => {
    setIsBulkReleaseLoading(true);

    // TODO: Replace with actual API call
    // POST /v1/integrations/coolfarm-sai/v2/runs/release-stale
    // Body: { staleMinutes, limit }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const releasedCount = Math.min(summary.staleClaimCount, limit);
    toast.success(`Released ${releasedCount} stale claim${releasedCount !== 1 ? 's' : ''}`);

    // Update local state
    setSummary((prev) => ({
      ...prev,
      staleClaimCount: Math.max(0, prev.staleClaimCount - releasedCount),
      lastSweeperRun: new Date().toISOString(),
      lastSweeperReleasedCount: releasedCount,
      lastSweeperTriggerSource: 'manual',
    }));

    setIsBulkReleaseLoading(false);
    setBulkReleaseOpen(false);
  };

  // Confirmation modal content
  const getConfirmationContent = () => {
    if (!confirmAction) return { title: '', description: '', variant: 'default' as const };

    switch (confirmAction.type) {
      case 'claim':
        return {
          title: 'Claim Run',
          description: `Are you sure you want to claim run ${confirmAction.run.id.slice(0, 12)}...? This will assign it to you for processing.`,
          variant: 'default' as const,
          confirmLabel: 'Claim',
        };
      case 'release':
        return {
          title: confirmAction.force ? 'Force Release Run' : 'Release Run',
          description: confirmAction.force
            ? `Are you sure you want to force release run ${confirmAction.run.id.slice(0, 12)}...? This will remove the current claim regardless of who owns it.`
            : `Are you sure you want to release run ${confirmAction.run.id.slice(0, 12)}...?`,
          variant: confirmAction.force ? ('destructive' as const) : ('default' as const),
          confirmLabel: confirmAction.force ? 'Force Release' : 'Release',
        };
      case 'retry':
        return {
          title: 'Retry Run',
          description: `Are you sure you want to retry run ${confirmAction.run.id.slice(0, 12)}...? This will increment the attempt count and requeue the run.`,
          variant: 'default' as const,
          confirmLabel: 'Retry',
        };
    }
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
          Release Stale ({summary.staleClaimCount})
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
