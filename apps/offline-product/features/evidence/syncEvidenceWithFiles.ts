import { syncPlotEvidenceToBackend } from '@/features/api/postPlot';
import type { PlotEvidenceItem, PlotEvidenceKind } from '@/features/state/persistence';
import { isLocalEvidenceUri } from '@/features/evidence/evidenceContentType';
import { uploadEvidenceFileToStorage } from '@/features/evidence/uploadEvidenceToStorage';

const EVIDENCE_KINDS: PlotEvidenceKind[] = [
  'fpic_repository',
  'protected_area_permit',
  'labor_evidence',
  'tenure_evidence',
];

export type EvidenceSyncItem = {
  kind: PlotEvidenceKind;
  uri: string;
  label: string | null;
  mimeType: string | null;
  takenAt: number;
  storagePath?: string | null;
  uploadSkipped?: boolean;
};

export type EvidenceSyncSummary = {
  uploadedCount: number;
  metadataOnlyCount: number;
  failedUploadCount: number;
  notSignedIn: boolean;
  firstUploadError?: string;
};

async function resolveSyncUri(
  item: PlotEvidenceItem,
  farmerId: string,
  serverPlotId: string,
): Promise<{
  uri: string;
  storagePath?: string;
  uploadSkipped?: boolean;
  notSignedIn?: boolean;
  failed?: boolean;
  errorMessage?: string;
}> {
  if (!isLocalEvidenceUri(item.uri)) {
    return { uri: item.uri };
  }

  const upload = await uploadEvidenceFileToStorage({
    localUri: item.uri,
    mimeType: item.mimeType,
    label: item.label,
    farmerId,
    plotId: serverPlotId,
    kind: item.kind,
  });
  if (upload.ok) {
    return { uri: upload.remoteUrl, storagePath: upload.storagePath };
  }
  if (upload.reason === 'not_signed_in') {
    return { uri: item.uri, uploadSkipped: true, notSignedIn: true };
  }
  return {
    uri: item.uri,
    uploadSkipped: true,
    failed: true,
    errorMessage: upload.message ?? upload.reason,
  };
}

function assertEvidenceUploadedForAi(summary: EvidenceSyncSummary, items: PlotEvidenceItem[]): void {
  const localItems = items.filter((item) => isLocalEvidenceUri(item.uri));
  if (localItems.length === 0) {
    return;
  }
  if (summary.notSignedIn) {
    throw new Error('Sign in to upload evidence files for AI review.');
  }
  if (summary.uploadedCount === 0) {
    throw new Error(
      summary.firstUploadError ??
        'Could not upload evidence files. Check your connection and try Sync now.',
    );
  }
  if (summary.failedUploadCount > 0) {
    throw new Error(
      summary.firstUploadError ?? 'Some evidence files did not upload. Try Sync now again.',
    );
  }
}

/**
 * Upload local evidence files when storage is available, then sync structured metadata to the API.
 */
export async function syncPlotEvidenceWithFiles(params: {
  localPlotId: string;
  serverPlotId: string;
  farmerId: string;
  items: PlotEvidenceItem[];
  reason: string;
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
  onUriResolved?: (item: PlotEvidenceItem, remoteUri: string) => Promise<void>;
}): Promise<EvidenceSyncSummary> {
  const summary: EvidenceSyncSummary = {
    uploadedCount: 0,
    metadataOnlyCount: 0,
    failedUploadCount: 0,
    notSignedIn: false,
  };

  const resolved: EvidenceSyncItem[] = [];
  for (const item of params.items) {
    if (item.plotId !== params.localPlotId) continue;
    const next = await resolveSyncUri(item, params.farmerId, params.serverPlotId);
    if (next.notSignedIn) {
      summary.notSignedIn = true;
    }
    if (next.storagePath) {
      summary.uploadedCount += 1;
      if (params.onUriResolved && next.uri !== item.uri) {
        await params.onUriResolved(item, next.uri).catch(() => undefined);
      }
    } else if (next.failed) {
      summary.failedUploadCount += 1;
      summary.firstUploadError ??= next.errorMessage;
    } else if (!isLocalEvidenceUri(item.uri)) {
      summary.metadataOnlyCount += 1;
    } else if (next.uploadSkipped) {
      summary.failedUploadCount += 1;
      summary.firstUploadError ??= next.errorMessage;
    }
    resolved.push({
      kind: item.kind,
      uri: next.uri,
      label: item.label ?? null,
      mimeType: item.mimeType ?? null,
      takenAt: item.takenAt,
      storagePath: next.storagePath ?? null,
      uploadSkipped: next.uploadSkipped ?? false,
    });
  }

  for (const k of EVIDENCE_KINDS) {
    const subset = resolved.filter(
      (i) =>
        i.kind === k &&
        (typeof i.storagePath === 'string'
          ? i.storagePath.trim().length > 0
          : !isLocalEvidenceUri(i.uri)),
    );
    if (subset.length === 0) continue;
    await syncPlotEvidenceToBackend({
      plotId: params.serverPlotId,
      kind: k,
      items: subset,
      reason: params.reason,
      note: params.note ?? 'Evidence repository sync from device',
      hlcTimestamp: params.hlcTimestamp,
      clientEventId: params.clientEventId ? `${params.clientEventId}-${k}` : undefined,
    });
  }

  assertEvidenceUploadedForAi(summary, params.items);

  return summary;
}
