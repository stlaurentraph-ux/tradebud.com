import { describe, expect, it } from 'vitest';
import type { ExtendedCloudParityCounts } from './measureCloudParitySummaryLogic';
import {
  extendedParityGaps,
  formatCloudParityHints,
  summarizeCloudParityCounts,
} from './measureCloudParitySummaryLogic';

function baseCounts(overrides: Partial<ExtendedCloudParityCounts> = {}): ExtendedCloudParityCounts {
  return {
    localPlotCount: 0,
    serverPlotCount: null,
    localReceiptCount: 0,
    serverVoucherCount: null,
    localGroundPhotos: 0,
    serverGroundPhotos: null,
    localLandTitlePhotos: 0,
    serverLandTitlePhotos: null,
    localEvidenceDocs: 0,
    serverEvidenceDocs: null,
    localProducerComplete: false,
    serverHasProducerAudit: null,
    localPlotAttestationsComplete: 0,
    serverPlotAttestationAudits: null,
    localHasProfilePhoto: false,
    serverHasProfilePhoto: null,
    localHasWalkDraft: false,
    serverHasWalkDraft: null,
    ...overrides,
  };
}

describe('extendedParityGaps', () => {
  it('sums media gaps across photo and evidence types', () => {
    const gaps = extendedParityGaps(
      baseCounts({
        serverGroundPhotos: 2,
        serverLandTitlePhotos: 1,
        serverEvidenceDocs: 3,
      }),
    );
    expect(gaps.mediaGap).toBe(6);
  });

  it('prefers measured plot/receipt gaps over naive server-minus-local', () => {
    const gaps = extendedParityGaps(
      baseCounts({
        localPlotCount: 1,
        serverPlotCount: 3,
        localReceiptCount: 0,
        serverVoucherCount: 2,
        measuredPlotGap: 0,
        measuredReceiptGap: 0,
        measuredMediaGap: 0,
      }),
    );
    expect(gaps.plotGap).toBe(0);
    expect(gaps.receiptGap).toBe(0);
    expect(gaps.mediaGap).toBe(0);
  });
});

describe('summarizeCloudParityCounts', () => {
  it('flags restore when server has more plots than local', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({ localPlotCount: 1, serverPlotCount: 3 }),
    );
    expect(summary.needsRestore).toBe(true);
    expect(summary.plotGap).toBe(2);
  });

  it('flags restore when server has more media than local', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        serverGroundPhotos: 2,
        serverLandTitlePhotos: 1,
      }),
    );
    expect(summary.needsRestore).toBe(true);
    expect(summary.mediaGap).toBe(3);
  });

  it('flags profile photo gap', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        localHasProfilePhoto: false,
        serverHasProfilePhoto: true,
      }),
    );
    expect(summary.needsRestore).toBe(true);
    expect(summary.profilePhotoGap).toBe(true);
  });

  it('does not flag restore when counts match', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        localPlotCount: 2,
        serverPlotCount: 2,
        localReceiptCount: 1,
        serverVoucherCount: 1,
        localGroundPhotos: 1,
        serverGroundPhotos: 1,
        localLandTitlePhotos: 1,
        serverLandTitlePhotos: 1,
        localEvidenceDocs: 1,
        serverEvidenceDocs: 1,
      }),
    );
    expect(summary.needsRestore).toBe(false);
  });
});

describe('formatCloudParityHints', () => {
  it('includes media hint when media gap exists', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        serverLandTitlePhotos: 2,
      }),
    );
    const hints = formatCloudParityHints(summary, (key, params) => `${key}:${JSON.stringify(params ?? {})}`);
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media'))).toBe(true);
  });
});
