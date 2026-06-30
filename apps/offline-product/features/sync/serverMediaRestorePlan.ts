import {
  fetchPlotSyncedEvidence,
  fetchPlotTenureVerification,
  type PlotSyncedEvidenceRecord,
} from '@/features/api/postPlot';
import {
  isProducerEvidenceKind,
  producerEvidenceScopeId,
} from '@/features/evidence/evidenceScope';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { Plot } from '@/features/state/AppStateContext';
import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  capacityCappedMissing,
  latestAuditPhotosByServerPlot,
  localPhotoMatches,
  photoStorageKey,
  storagePathStored,
  titlePhotoStored,
  type AuditPhotoPayload,
} from '@/features/sync/mediaPhotoMatch';
import {
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

export type ServerEvidenceCandidate = {
  storagePath: string;
  mimeType: string | null;
  label: string | null;
  kind: string;
  takenAt: number;
  serverPlotId: string;
};

/** Same server plot scope as restoreLocalEvidenceFromServer (links + backend rows). */
export function buildMediaRestoreServerPlotIds(params: {
  localPlots: readonly Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots: readonly unknown[];
}): Set<string> {
  const linkedServerPlotIds = new Set<string>();
  for (const plot of params.localPlots) {
    const serverPlotId = params.plotServerLinks[plot.id]?.trim();
    if (serverPlotId) linkedServerPlotIds.add(serverPlotId);
  }
  for (const row of params.backendPlots) {
    const serverPlotId = String((row as { id?: string }).id ?? '').trim();
    if (serverPlotId) linkedServerPlotIds.add(serverPlotId);
  }
  return linkedServerPlotIds;
}

export function normalizeEvidenceKind(raw: string): PlotEvidenceKind | 'land_title' {
  const kind = raw.trim();
  if (
    kind === 'fpic_repository' ||
    kind === 'protected_area_permit' ||
    kind === 'labor_evidence' ||
    kind === 'tenure_evidence' ||
    kind === 'land_title'
  ) {
    return kind;
  }
  return 'tenure_evidence';
}

/** Same target plot id as restoreLocalEvidenceFromServer (producer docs → profile scope). */
export function resolveEvidenceLocalTargetPlotId(params: {
  kind: string;
  apiFarmerId: string;
  localPlotId: string;
}): string {
  const normalized = normalizeEvidenceKind(params.kind);
  if (normalized === 'land_title') {
    return params.localPlotId;
  }
  if (isProducerEvidenceKind(normalized)) {
    return producerEvidenceScopeId(params.apiFarmerId);
  }
  return params.localPlotId;
}

export function candidatesFromSyncedEvidence(
  serverPlotId: string,
  rows: PlotSyncedEvidenceRecord[],
): ServerEvidenceCandidate[] {
  return rows.map((row) => ({
    storagePath: row.file_storage_key,
    mimeType: row.mime_type,
    label: row.evidence_kind,
    kind: row.evidence_kind,
    takenAt: Date.parse(row.updated_at) || Date.now(),
    serverPlotId,
  }));
}

export function candidatesFromTenureVerification(
  serverPlotId: string,
  rows: Awaited<ReturnType<typeof fetchPlotTenureVerification>>,
): ServerEvidenceCandidate[] {
  return rows
    .map((row) => ({
      storagePath: row.storage_path?.trim() ?? '',
      mimeType: row.mime_type,
      label: row.evidence_label,
      kind: 'land_title',
      takenAt: Date.parse(row.created_at) || Date.now(),
      serverPlotId,
    }))
    .filter((row) => row.storagePath.length > 0);
}

function registerSeenMediaKey(seenKeys: Set<string>, key: string, storagePath?: string) {
  seenKeys.add(key);
  const path = storagePath?.trim();
  if (path) seenKeys.add(`path:${path}`);
}

type ScopeMediaGap = {
  serverCount: number;
  unmatched: number;
  localCount: number;
};

function cappedScopePending(gap: ScopeMediaGap): number {
  return capacityCappedMissing(gap.unmatched, gap.serverCount, gap.localCount);
}

/** Dry-run of restoreLocalPlotPhotosFromServerAudit — counts rows Sync now would still pull. */
export async function planPendingAuditMediaRestore(params: {
  auditRows: readonly AuditLogRow[];
  localPlots: readonly Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots: readonly unknown[];
  seenStoragePaths?: Set<string>;
}): Promise<number> {
  const seenKeys = params.seenStoragePaths ?? new Set<string>();
  const { groundTruth, landTitle } = latestAuditPhotosByServerPlot(params.auditRows);

  async function countKind(
    kind: 'ground_truth' | 'land_title',
    latestByServerPlot: Map<string, AuditPhotoPayload[]>,
  ) {
    const gapsByLocalPlot = new Map<string, ScopeMediaGap>();

    for (const [serverPlotId, photos] of latestByServerPlot) {
      const localPlotId = resolveLocalPlotIdForServerPlot({
        serverPlotId,
        localPlots: params.localPlots,
        plotServerLinks: params.plotServerLinks,
        backendPlots: params.backendPlots,
      });
      if (!localPlotId) continue;

      const existingGround =
        kind === 'ground_truth' ? await loadPhotosForPlot(localPlotId).catch(() => []) : [];
      const existingTitle =
        kind === 'land_title' ? await loadTitlePhotosForPlot(localPlotId).catch(() => []) : [];
      const localCount =
        kind === 'ground_truth' ? existingGround.length : existingTitle.length;
      const gap = gapsByLocalPlot.get(localPlotId) ?? {
        serverCount: 0,
        unmatched: 0,
        localCount,
      };
      gap.localCount = Math.max(gap.localCount, localCount);

      for (const photo of photos) {
        const key = photoStorageKey(photo);
        if (!key || seenKeys.has(key)) continue;

        const remoteUri = photo.uri?.trim() ?? '';
        const stored =
          kind === 'ground_truth'
            ? existingGround.some((row) => localPhotoMatches(row, photo, remoteUri))
            : titlePhotoStored(existingTitle, photo.storagePath, remoteUri);

        registerSeenMediaKey(seenKeys, key, photo.storagePath);
        gap.serverCount += 1;
        if (!stored) gap.unmatched += 1;
      }
      gapsByLocalPlot.set(localPlotId, gap);
    }

    let pending = 0;
    for (const gap of gapsByLocalPlot.values()) {
      pending += cappedScopePending(gap);
    }
    return pending;
  }

  const groundPending = await countKind('ground_truth', groundTruth);
  const landPending = await countKind('land_title', landTitle);
  return groundPending + landPending;
}

/** Dry-run of restoreLocalEvidenceFromServer — uses producer/profile scope for farmer docs. */
export async function planPendingEvidenceRestore(params: {
  apiFarmerId: string;
  localPlots: readonly Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots: readonly unknown[];
  serverPlotIds: ReadonlySet<string>;
  seenStoragePaths?: Set<string>;
}): Promise<number> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId || params.serverPlotIds.size === 0) return 0;

  const seenStoragePaths = params.seenStoragePaths ?? new Set<string>();
  const candidates: ServerEvidenceCandidate[] = [];

  for (const serverPlotId of params.serverPlotIds) {
    try {
      const [syncedRows, tenureRows] = await Promise.all([
        fetchPlotSyncedEvidence(serverPlotId),
        fetchPlotTenureVerification(serverPlotId),
      ]);
      for (const row of [
        ...candidatesFromSyncedEvidence(serverPlotId, syncedRows),
        ...candidatesFromTenureVerification(serverPlotId, tenureRows),
      ]) {
        const key = row.storagePath.trim();
        if (!key || seenStoragePaths.has(key)) continue;
        seenStoragePaths.add(key);
        candidates.push(row);
      }
    } catch {
      continue;
    }
  }

  const gapsByTarget = new Map<string, ScopeMediaGap>();
  const mediaCache = new Map<
    string,
    Promise<{ titlePhotos: Awaited<ReturnType<typeof loadTitlePhotosForPlot>>; evidenceItems: Awaited<ReturnType<typeof loadEvidenceForPlot>> }>
  >();

  async function loadTargetMedia(targetPlotId: string) {
    let cached = mediaCache.get(targetPlotId);
    if (!cached) {
      cached = Promise.all([
        loadTitlePhotosForPlot(targetPlotId).catch(() => []),
        loadEvidenceForPlot(targetPlotId).catch(() => []),
      ]).then(([titlePhotos, evidenceItems]) => ({ titlePhotos, evidenceItems }));
      mediaCache.set(targetPlotId, cached);
    }
    return cached;
  }

  for (const candidate of candidates) {
    const localPlotId = resolveLocalPlotIdForServerPlot({
      serverPlotId: candidate.serverPlotId,
      localPlots: params.localPlots,
      plotServerLinks: params.plotServerLinks,
      backendPlots: params.backendPlots,
    });
    if (!localPlotId) continue;

    const targetPlotId = resolveEvidenceLocalTargetPlotId({
      kind: candidate.kind,
      apiFarmerId,
      localPlotId,
    });

    const { titlePhotos, evidenceItems } = await loadTargetMedia(targetPlotId);
    const gap = gapsByTarget.get(targetPlotId) ?? {
      serverCount: 0,
      unmatched: 0,
      localCount: titlePhotos.length + evidenceItems.length,
    };
    gap.localCount = Math.max(gap.localCount, titlePhotos.length + evidenceItems.length);

    gap.serverCount += 1;
    if (!storagePathStored(candidate.storagePath, titlePhotos, evidenceItems)) {
      gap.unmatched += 1;
    }
    gapsByTarget.set(targetPlotId, gap);
  }

  let pending = 0;
  for (const gap of gapsByTarget.values()) {
    pending += cappedScopePending(gap);
  }
  return pending;
}

/**
 * Single source of truth for cloud media parity — mirrors restoreFarmerCloudState media steps.
 */
export async function countPendingServerMediaRestore(params: {
  apiFarmerId: string;
  localPlots: Plot[];
  auditRows: AuditLogRow[] | null;
  backendPlots: readonly unknown[];
  plotServerLinks: Record<string, string>;
}): Promise<number> {
  if (params.auditRows == null) return 0;

  const seenStoragePaths = new Set<string>();
  const auditPending = await planPendingAuditMediaRestore({
    auditRows: params.auditRows,
    localPlots: params.localPlots,
    plotServerLinks: params.plotServerLinks,
    backendPlots: params.backendPlots,
    seenStoragePaths,
  });

  const serverPlotIds = buildMediaRestoreServerPlotIds({
    localPlots: params.localPlots,
    plotServerLinks: params.plotServerLinks,
    backendPlots: params.backendPlots,
  });

  const evidencePending = await planPendingEvidenceRestore({
    apiFarmerId: params.apiFarmerId,
    localPlots: params.localPlots,
    plotServerLinks: params.plotServerLinks,
    backendPlots: params.backendPlots,
    serverPlotIds,
    seenStoragePaths,
  });

  return auditPending + evidencePending;
}
