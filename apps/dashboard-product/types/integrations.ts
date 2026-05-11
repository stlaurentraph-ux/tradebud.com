// ============================================================
// INTEGRATIONS OPERATIONS CONSOLE - TYPE DEFINITIONS
// Aligned with backend contract for Cool Farm + SAI V2 operations
// ============================================================

export type RunType = 'validation' | 'scoring';
export type RunStatus = 'started' | 'completed' | 'failed';
export type TriggerSource = 'manual' | 'scheduled';

export interface IntegrationRun {
  id: string;
  questionnaireId: string;
  runType: RunType;
  status: RunStatus;
  attemptCount: number;
  errorCode: string | null;
  queuedAt: string;
  nextRetryAt: string | null;
  claimedByUserId: string | null;
  claimedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}

export interface RunSummary {
  startedCount: number;
  completedCount: number;
  failedCount: number;
  staleClaimCount: number;
  lastSweeperRun: string | null;
  lastSweeperReleasedCount: number;
  lastSweeperTriggerSource: TriggerSource | null;
  lastSweeperTokenVersion: string | null;
}

export interface StaleReleaseRequest {
  staleMinutes: number;
  limit: number;
}

export interface StaleReleaseResult {
  releasedCount: number;
  timestamp: string;
  triggerSource: TriggerSource;
  tokenVersion: string | null;
}

export interface TimelineEvent {
  id: string;
  type: 
    | 'draft_saved'
    | 'submitted'
    | 'run_started'
    | 'run_completed'
    | 'run_failed'
    | 'claimed'
    | 'released'
    | 'retried'
    | 'stale_released';
  timestamp: string;
  actor?: string;
  payload?: Record<string, unknown>;
}

export interface SchedulerConfig {
  tokenConfigured: boolean;
  tokenVersion: string | null;
  defaultStaleMinutes: number;
  defaultLimit: number;
}

export type FilterStatus = 'all' | RunStatus;
export type FilterRunType = 'all' | RunType;
export type FilterClaimStatus = 'all' | 'claimed' | 'unclaimed';

export interface RunQueueFilters {
  status: FilterStatus;
  runType: FilterRunType;
  claimStatus: FilterClaimStatus;
  dueNow: boolean;
  search: string;
}
