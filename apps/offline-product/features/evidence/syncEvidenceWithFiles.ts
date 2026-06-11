import { syncPlotEvidenceToBackend } from '@/features/api/postPlot';
import type { PlotEvidenceItem, PlotEvidenceKind } from '@/features/state/persistence';
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
};

async function resolveSyncUri(
  item: PlotEvidenceItem,
  farmerId: string,
): Promise<{ uri: string; storagePath?: string; uploadSkipped?: boolean; notSignedIn?: boolean }> {
  const upload = await uploadEvidenceFileToStorage({
    localUri: item.uri,
    mimeType: item.mimeType,
    label: item.label,
    farmerId,
    plotId: item.plotId,
    kind: item.kind,
  });
  if (upload.ok) {
    return { uri: upload.remoteUrl, storagePath: upload.storagePath };
  }
  if (!upload.ok && upload.reason === 'not_signed_in') {
    return { uri: item.uri, uploadSkipped: true, notSignedIn: true };
  }
  return { uri: item.uri, uploadSkipped: true };
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
    const next = await resolveSyncUri(item, params.farmerId);
    if (next.notSignedIn) {
      summary.notSignedIn = true;
    }
    if (next.storagePath) {
      summary.uploadedCount += 1;
    } else if (next.uploadSkipped) {
      summary.metadataOnlyCount += 1;
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
    const subset = resolved.filter((i) => i.kind === k);
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

  return summary;
}
