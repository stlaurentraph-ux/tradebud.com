/**
 * INTEGRATIONS OPERATIONS CONSOLE - MOCK DATA
 * Realistic fake data for UI development and testing
 * Replace with actual API calls when backend is ready
 */

import type {
  IntegrationRun,
  RunSummary,
  TimelineEvent,
  SchedulerConfig,
  StaleReleaseResult,
} from '@/types/integrations';

function generateRunId(): string {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateQuestionnaireId(): string {
  const prefixes = ['QST', 'FORM', 'CFT'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
}

function pastTimestamp(hoursAgo: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

function futureTimestamp(hoursFromNow: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
}

const mockUsers = [
  { id: 'user_001', name: 'Maria Silva' },
  { id: 'user_002', name: 'Jean-Pierre Muller' },
  { id: 'user_003', name: 'Amara Okafor' },
  { id: 'user_004', name: 'System Scheduler' },
];

export function generateMockRuns(): IntegrationRun[] {
  const runs: IntegrationRun[] = [];
  
  // Started runs (in progress)
  for (let i = 0; i < 3; i++) {
    const hoursAgo = Math.floor(Math.random() * 2) + 0.5;
    runs.push({
      id: generateRunId(),
      questionnaireId: generateQuestionnaireId(),
      runType: Math.random() > 0.5 ? 'validation' : 'scoring',
      status: 'started',
      attemptCount: 1,
      errorCode: null,
      queuedAt: pastTimestamp(hoursAgo + 0.5),
      nextRetryAt: null,
      claimedByUserId: mockUsers[Math.floor(Math.random() * 3)].id,
      claimedAt: pastTimestamp(hoursAgo),
      startedAt: pastTimestamp(hoursAgo - 0.1),
      finishedAt: null,
      updatedAt: pastTimestamp(hoursAgo - 0.1),
    });
  }

  // Completed runs
  for (let i = 0; i < 8; i++) {
    const hoursAgo = Math.floor(Math.random() * 24) + 1;
    runs.push({
      id: generateRunId(),
      questionnaireId: generateQuestionnaireId(),
      runType: Math.random() > 0.4 ? 'scoring' : 'validation',
      status: 'completed',
      attemptCount: Math.floor(Math.random() * 3) + 1,
      errorCode: null,
      queuedAt: pastTimestamp(hoursAgo + 1),
      nextRetryAt: null,
      claimedByUserId: null,
      claimedAt: null,
      startedAt: pastTimestamp(hoursAgo + 0.5),
      finishedAt: pastTimestamp(hoursAgo),
      updatedAt: pastTimestamp(hoursAgo),
    });
  }

  // Failed runs (with retry scheduled)
  const errorCodes = [
    'COOLFARM_API_TIMEOUT',
    'SAI_VALIDATION_ERROR',
    'NETWORK_UNREACHABLE',
    'INVALID_QUESTIONNAIRE_DATA',
    'RATE_LIMIT_EXCEEDED',
    'AUTH_TOKEN_EXPIRED',
  ];
  
  for (let i = 0; i < 5; i++) {
    const hoursAgo = Math.floor(Math.random() * 6) + 1;
    const attempts = Math.floor(Math.random() * 4) + 1;
    const isDueNow = Math.random() > 0.5;
    const isStale = Math.random() > 0.7;
    
    runs.push({
      id: generateRunId(),
      questionnaireId: generateQuestionnaireId(),
      runType: Math.random() > 0.5 ? 'validation' : 'scoring',
      status: 'failed',
      attemptCount: attempts,
      errorCode: errorCodes[Math.floor(Math.random() * errorCodes.length)],
      queuedAt: pastTimestamp(hoursAgo + 2),
      nextRetryAt: isDueNow ? pastTimestamp(0.5) : futureTimestamp(Math.floor(Math.random() * 4) + 1),
      claimedByUserId: isStale ? mockUsers[Math.floor(Math.random() * 3)].id : null,
      claimedAt: isStale ? pastTimestamp(hoursAgo + 1) : null,
      startedAt: pastTimestamp(hoursAgo + 0.5),
      finishedAt: pastTimestamp(hoursAgo),
      updatedAt: pastTimestamp(hoursAgo),
    });
  }

  return runs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getMockSummary(): RunSummary {
  return {
    startedCount: 3,
    completedCount: 142,
    failedCount: 5,
    staleClaimCount: 2,
    lastSweeperRun: pastTimestamp(1.5),
    lastSweeperReleasedCount: 3,
    lastSweeperTriggerSource: 'scheduled',
    lastSweeperTokenVersion: 'v4',
  };
}

export function getMockTimeline(runId: string): TimelineEvent[] {
  const baseTime = new Date();
  baseTime.setHours(baseTime.getHours() - 4);
  
  return [
    {
      id: `${runId}-evt-1`,
      type: 'draft_saved',
      timestamp: new Date(baseTime.getTime()).toISOString(),
      actor: 'Maria Silva',
    },
    {
      id: `${runId}-evt-2`,
      type: 'submitted',
      timestamp: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString(),
      actor: 'Maria Silva',
    },
    {
      id: `${runId}-evt-3`,
      type: 'run_started',
      timestamp: new Date(baseTime.getTime() + 35 * 60 * 1000).toISOString(),
      payload: { runType: 'validation', attemptCount: 1 },
    },
    {
      id: `${runId}-evt-4`,
      type: 'run_failed',
      timestamp: new Date(baseTime.getTime() + 40 * 60 * 1000).toISOString(),
      payload: { errorCode: 'COOLFARM_API_TIMEOUT', attemptCount: 1 },
    },
    {
      id: `${runId}-evt-5`,
      type: 'claimed',
      timestamp: new Date(baseTime.getTime() + 120 * 60 * 1000).toISOString(),
      actor: 'Jean-Pierre Muller',
    },
    {
      id: `${runId}-evt-6`,
      type: 'retried',
      timestamp: new Date(baseTime.getTime() + 125 * 60 * 1000).toISOString(),
      actor: 'Jean-Pierre Muller',
      payload: { attemptCount: 2 },
    },
  ];
}

export function getMockSchedulerConfig(): SchedulerConfig {
  return {
    tokenConfigured: true,
    tokenVersion: 'v4',
    defaultStaleMinutes: 60,
    defaultLimit: 100,
  };
}

export function getMockLastTriggerResult(): StaleReleaseResult | null {
  return {
    releasedCount: 3,
    timestamp: pastTimestamp(1.5),
    triggerSource: 'scheduled',
    tokenVersion: 'v4',
  };
}

export function getUserNameById(userId: string | null): string {
  if (!userId) return '-';
  const user = mockUsers.find((u) => u.id === userId);
  return user?.name ?? userId;
}
