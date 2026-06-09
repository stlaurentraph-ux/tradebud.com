import type { IntegrationRun, RunSummary, StaleReleaseResult, TriggerSource } from '@/types/integrations';

type RunRow = Record<string, unknown>;

export function mapIntegrationRun(item: RunRow): IntegrationRun {
  return {
    id: String(item.id ?? ''),
    questionnaireId: String(item.questionnaireId ?? item.questionnaire_id ?? ''),
    runType: item.runType === 'scoring' || item.run_type === 'scoring' ? 'scoring' : 'validation',
    status: item.status === 'completed' || item.status === 'started' ? item.status : 'failed',
    attemptCount: Number(item.attemptCount ?? item.attempt_count ?? 0),
    errorCode:
      typeof item.errorCode === 'string'
        ? item.errorCode
        : typeof item.error_code === 'string'
          ? item.error_code
          : null,
    queuedAt: String(item.queuedAt ?? item.queued_at ?? item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
    nextRetryAt:
      typeof item.nextRetryAt === 'string'
        ? item.nextRetryAt
        : typeof item.next_retry_at === 'string'
          ? item.next_retry_at
          : null,
    claimedByUserId:
      typeof item.claimedByUserId === 'string'
        ? item.claimedByUserId
        : typeof item.claimed_by_user_id === 'string'
          ? item.claimed_by_user_id
          : null,
    claimedAt:
      typeof item.claimedAt === 'string'
        ? item.claimedAt
        : typeof item.claimed_at === 'string'
          ? item.claimed_at
          : null,
    startedAt:
      typeof item.startedAt === 'string'
        ? item.startedAt
        : typeof item.started_at === 'string'
          ? item.started_at
          : null,
    finishedAt:
      typeof item.finishedAt === 'string'
        ? item.finishedAt
        : typeof item.finished_at === 'string'
          ? item.finished_at
          : null,
    updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
  };
}

export function mapRunSummary(body: Record<string, unknown>): RunSummary {
  const counts = (body.counts ?? {}) as Record<string, number>;
  return {
    startedCount: Number(counts.started ?? 0),
    completedCount: Number(counts.completed ?? 0),
    failedCount: Number(counts.failed ?? 0),
    staleClaimCount: Number(body.staleClaimCount ?? 0),
    lastSweeperRun:
      typeof (body.lastSweeperRun as { created_at?: string } | null)?.created_at === 'string'
        ? (body.lastSweeperRun as { created_at: string }).created_at
        : null,
    lastSweeperReleasedCount: Number(body.lastSweeperReleasedCount ?? 0),
    lastSweeperTriggerSource:
      body.lastSweeperTriggerSource === 'scheduled'
        ? 'scheduled'
        : body.lastSweeperTriggerSource === 'manual'
          ? 'manual'
          : null,
    lastSweeperTokenVersion:
      typeof body.lastSweeperTokenVersion === 'string' ? body.lastSweeperTokenVersion : null,
  };
}

export function mapStaleReleaseResult(body: Record<string, unknown>): StaleReleaseResult {
  return {
    releasedCount: typeof body.releasedCount === 'number' ? body.releasedCount : 0,
    timestamp: new Date().toISOString(),
    triggerSource: body.triggerSource === 'scheduled' ? 'scheduled' : 'manual',
    tokenVersion:
      typeof body.schedulerTokenVersion === 'string'
        ? body.schedulerTokenVersion
        : typeof body.tokenVersion === 'string'
          ? body.tokenVersion
          : null,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  return response.json().catch(() => null);
}

export async function fetchRunSummary(): Promise<RunSummary> {
  const response = await fetch('/api/integrations/coolfarm-sai/v2/runs/summary', { cache: 'no-store' });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load run summary.');
  }
  return mapRunSummary(body ?? {});
}

export async function fetchRetryQueue(limit = 200): Promise<IntegrationRun[]> {
  const response = await fetch(`/api/integrations/coolfarm-sai/v2/runs/retry-queue?limit=${limit}`, {
    cache: 'no-store',
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load retry queue.');
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  return items.map((item) => mapIntegrationRun(item as RunRow));
}

export async function claimRun(runId: string): Promise<void> {
  const response = await fetch(`/api/integrations/coolfarm-sai/v2/runs/${encodeURIComponent(runId)}/claim`, {
    method: 'POST',
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to claim run.');
  }
}

export async function releaseRun(runId: string, force: boolean): Promise<void> {
  const response = await fetch(`/api/integrations/coolfarm-sai/v2/runs/${encodeURIComponent(runId)}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to release run.');
  }
}

export async function retryRun(runId: string): Promise<void> {
  const response = await fetch(`/api/integrations/coolfarm-sai/v2/runs/${encodeURIComponent(runId)}/retry`, {
    method: 'POST',
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to retry run.');
  }
}

export async function releaseStaleClaims(staleMinutes: number, limit: number): Promise<number> {
  const response = await fetch('/api/integrations/coolfarm-sai/v2/runs/release-stale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staleMinutes, limit }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to release stale claims.');
  }
  return typeof body?.releasedCount === 'number' ? body.releasedCount : 0;
}

export type SchedulerConfigResponse = {
  tokenConfigured: boolean;
  tokenVersion: string | null;
  defaultStaleMinutes: number;
  defaultLimit: number;
};

export async function fetchSchedulerConfig(): Promise<SchedulerConfigResponse> {
  const response = await fetch('/api/integrations/coolfarm-sai/v2/scheduler/config', { cache: 'no-store' });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load scheduler config.');
  }
  return {
    tokenConfigured: Boolean(body?.tokenConfigured),
    tokenVersion: typeof body?.tokenVersion === 'string' ? body.tokenVersion : null,
    defaultStaleMinutes: typeof body?.defaultStaleMinutes === 'number' ? body.defaultStaleMinutes : 60,
    defaultLimit: typeof body?.defaultLimit === 'number' ? body.defaultLimit : 100,
  };
}

export async function triggerStaleSweeper(
  staleMinutes: number,
  limit: number,
): Promise<StaleReleaseResult & { triggerSource: TriggerSource }> {
  const response = await fetch('/api/integrations/coolfarm-sai/v2/runs/release-stale/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staleMinutes, limit }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to trigger stale sweeper.');
  }
  return mapStaleReleaseResult(body ?? {});
}
