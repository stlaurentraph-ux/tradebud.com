import { describe, expect, it } from 'vitest';
import { summarizeCloudParityCounts } from './measureCloudParitySummaryLogic';

describe('summarizeCloudParityCounts', () => {
  it('flags restore when server has more plots than local', () => {
    const summary = summarizeCloudParityCounts({
      localPlotCount: 1,
      serverPlotCount: 3,
      localReceiptCount: 0,
      serverVoucherCount: 0,
    });
    expect(summary.needsRestore).toBe(true);
    expect(summary.plotGap).toBe(2);
    expect(summary.receiptGap).toBe(0);
  });

  it('flags restore when server has more vouchers than local receipts', () => {
    const summary = summarizeCloudParityCounts({
      localPlotCount: 2,
      serverPlotCount: 2,
      localReceiptCount: 0,
      serverVoucherCount: 4,
    });
    expect(summary.needsRestore).toBe(true);
    expect(summary.plotGap).toBe(0);
    expect(summary.receiptGap).toBe(4);
  });

  it('does not flag restore when counts match', () => {
    const summary = summarizeCloudParityCounts({
      localPlotCount: 2,
      serverPlotCount: 2,
      localReceiptCount: 1,
      serverVoucherCount: 1,
    });
    expect(summary.needsRestore).toBe(false);
    expect(summary.plotGap).toBe(0);
    expect(summary.receiptGap).toBe(0);
  });

  it('does not flag restore when server counts are unknown', () => {
    const summary = summarizeCloudParityCounts({
      localPlotCount: 0,
      serverPlotCount: null,
      localReceiptCount: 0,
      serverVoucherCount: null,
    });
    expect(summary.needsRestore).toBe(false);
  });
});
