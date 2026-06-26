import { describe, expect, it } from 'vitest';

import { summarizeHomeBackupAttention } from './homeBackupAttention';

describe('summarizeHomeBackupAttention', () => {
  it('treats persisted server links as backed up when signed out (no pending queue)', () => {
    const summary = summarizeHomeBackupAttention({
      plotCount: 2,
      pendingQueueCount: 0,
      unsyncedPlotCount: 0,
      blockedPlotCount: 0,
    });
    expect(summary.plotsBackedUpOnDevice).toBe(true);
    expect(summary.needsBackupAttention).toBe(false);
  });

  it('flags attention when local plots still need first upload', () => {
    const summary = summarizeHomeBackupAttention({
      plotCount: 1,
      pendingQueueCount: 0,
      unsyncedPlotCount: 1,
      blockedPlotCount: 0,
    });
    expect(summary.needsBackupAttention).toBe(true);
    expect(summary.plotsBackedUpOnDevice).toBe(false);
  });

  it('ignores backup card when there are no plots', () => {
    const summary = summarizeHomeBackupAttention({
      plotCount: 0,
      pendingQueueCount: 0,
      unsyncedPlotCount: 0,
      blockedPlotCount: 0,
    });
    expect(summary.plotsBackedUpOnDevice).toBe(false);
    expect(summary.needsBackupAttention).toBe(false);
  });
});
