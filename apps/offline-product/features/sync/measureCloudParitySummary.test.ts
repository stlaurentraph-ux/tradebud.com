import { describe, expect, it } from 'vitest';
import type { ExtendedCloudParityCounts } from './measureCloudParitySummaryLogic';
import {
  effectiveCloudParityNeedsRestore,
  extendedParityGaps,
  formatCloudParityHints,
  parityNeedsFullInboundRestore,
  summarizeCloudParityCounts,
} from './measureCloudParitySummaryLogic';

function baseCounts(overrides: Partial<ExtendedCloudParityCounts> = {}): ExtendedCloudParityCounts {
  return {
    localPlotCount: 0,
    serverPlotCount: null,
    serverPlotsMissingOnDevice: null,
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
    producerAttestationMissingOnDevice: false,
    plotAttestationsMissingOnDevice: 0,
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

  it('does not flag declaration restore when server audits exist only for plots not on device', () => {
    const gaps = extendedParityGaps(
      baseCounts({
        localPlotCount: 2,
        localPlotAttestationsComplete: 2,
        serverPlotAttestationAudits: 5,
        producerAttestationMissingOnDevice: false,
        plotAttestationsMissingOnDevice: 0,
      }),
    );
    expect(gaps.declarationGap).toBe(0);
  });

  it('flags declaration restore when linked local plot is missing attestations', () => {
    const gaps = extendedParityGaps(
      baseCounts({
        producerAttestationMissingOnDevice: true,
        plotAttestationsMissingOnDevice: 1,
      }),
    );
    expect(gaps.declarationGap).toBe(2);
  });

  it('does not require full restore for declaration-only parity gaps', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        producerAttestationMissingOnDevice: true,
        plotAttestationsMissingOnDevice: 1,
      }),
    );
    expect(parityNeedsFullInboundRestore(summary)).toBe(false);
    expect(
      effectiveCloudParityNeedsRestore({
        flagged: summary.needsInboundRestore,
        summary,
        localDeclarationsComplete: true,
      }),
    ).toBe(false);
    expect(
      effectiveCloudParityNeedsRestore({
        flagged: summary.needsInboundRestore,
        summary,
        localDeclarationsComplete: false,
      }),
    ).toBe(true);
  });
});

describe('summarizeCloudParityCounts', () => {
  it('flags restore when server has more plots than local', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({ localPlotCount: 1, serverPlotsMissingOnDevice: 2 }),
    );
    expect(summary.needsRestore).toBe(true);
    expect(summary.plotGap).toBe(2);
  });

  it('does not flag plot restore when server extras already match local links', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        localPlotCount: 2,
        serverPlotCount: 4,
        serverPlotsMissingOnDevice: 0,
      }),
    );
    expect(summary.plotGap).toBe(0);
    expect(summary.needsRestore).toBe(false);
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
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media:'))).toBe(true);
  });

  it('prefers upload pending hint over restore when media queue rows exist', () => {
    const summary = summarizeCloudParityCounts(
      baseCounts({
        serverLandTitlePhotos: 2,
      }),
    );
    const hints = formatCloudParityHints(summary, (key, params) => `${key}:${JSON.stringify(params ?? {})}`, {
      queueMediaPendingCount: 2,
    });
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media_upload_pending:'))).toBe(true);
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media:'))).toBe(true);
  });

  it('can show upload-only hints when nothing needs inbound restore', () => {
    const summary = summarizeCloudParityCounts(baseCounts());
    const hints = formatCloudParityHints(summary, (key, params) => `${key}:${JSON.stringify(params ?? {})}`, {
      queueMediaPendingCount: 1,
    });
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media_upload_pending:'))).toBe(true);
    expect(hints.some((h) => h.startsWith('settings_cloud_parity_media:'))).toBe(false);
  });
});
