import { describe, expect, it } from 'vitest';
import { mapIntegrationRun, mapRunSummary } from './integrations-v2-api';

describe('integrations-v2-api mappers', () => {
  it('maps snake_case backend run rows', () => {
    const run = mapIntegrationRun({
      id: 'run-1',
      questionnaire_id: 'q-1',
      run_type: 'validation',
      status: 'failed',
      attempt_count: 2,
      error_code: 'V2_SHADOW_RUN_FAILED',
      queued_at: '2026-06-01T10:00:00.000Z',
      next_retry_at: '2026-06-01T11:00:00.000Z',
      claimed_by_user_id: 'user-1',
      claimed_at: '2026-06-01T10:30:00.000Z',
      updated_at: '2026-06-01T10:45:00.000Z',
    });

    expect(run).toMatchObject({
      id: 'run-1',
      questionnaireId: 'q-1',
      runType: 'validation',
      status: 'failed',
      attemptCount: 2,
      errorCode: 'V2_SHADOW_RUN_FAILED',
      claimedByUserId: 'user-1',
    });
  });

  it('maps run summary counts and sweeper metadata', () => {
    const summary = mapRunSummary({
      counts: { started: 1, completed: 4, failed: 2 },
      staleClaimCount: 3,
      lastSweeperRun: { created_at: '2026-06-01T09:00:00.000Z' },
      lastSweeperReleasedCount: 2,
      lastSweeperTriggerSource: 'manual',
      lastSweeperTokenVersion: 'v2',
    });

    expect(summary).toEqual({
      startedCount: 1,
      completedCount: 4,
      failedCount: 2,
      staleClaimCount: 3,
      lastSweeperRun: '2026-06-01T09:00:00.000Z',
      lastSweeperReleasedCount: 2,
      lastSweeperTriggerSource: 'manual',
      lastSweeperTokenVersion: 'v2',
    });
  });
});
