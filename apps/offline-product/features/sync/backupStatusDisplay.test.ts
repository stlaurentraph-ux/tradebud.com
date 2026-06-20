import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

import { resolveBackupStatusDisplay } from './backupStatusDisplay';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('resolveBackupStatusDisplay', () => {
  const base = {
    isSignedIn: true,
    isSyncInProgress: false,
    plotsFetchState: 'ok' as const,
    syncAccessFailure: null,
    totalSyncPending: 0,
    plotsCount: 2,
    hasSettledMetrics: true,
    syncApiBaseUrl: 'https://api.tracebud.com/api',
  };

  it('shows up to date when metrics are settled and nothing pending', () => {
    expect(resolveBackupStatusDisplay(base, t)).toEqual({
      label: 'backup_up_to_date',
      needsAttention: false,
    });
  });

  it('does not flash checking when a background refresh is loading but metrics exist', () => {
    expect(
      resolveBackupStatusDisplay(
        {
          ...base,
          plotsFetchState: 'loading',
          totalSyncPending: 2,
        },
        t,
      ),
    ).toEqual({
      label: 'backup_waiting:{"n":2}',
      needsAttention: true,
    });
  });

  it('shows checking only on first load without settled metrics', () => {
    expect(
      resolveBackupStatusDisplay(
        {
          ...base,
          hasSettledMetrics: false,
          plotsFetchState: 'loading',
        },
        t,
      ),
    ).toEqual({
      label: 'settings_backup_status_checking',
      needsAttention: true,
    });
  });
});
