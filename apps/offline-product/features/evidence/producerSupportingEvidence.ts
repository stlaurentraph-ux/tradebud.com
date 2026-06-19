import type { Plot } from '@/features/state/AppStateContext';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { isLocalEvidenceUri } from '@/features/evidence/evidenceContentType';
import { resolveDocumentUploadReason } from '@/features/evidence/documentUploadReason';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import {
  isProducerAdditionalFile,
  PRODUCER_ADDITIONAL_FILE_LABEL,
  PRODUCER_COMMUNITY_FILE_LABEL,
  PRODUCER_LABOR_FILE_LABEL,
} from '@/features/evidence/producerSupportingFileLabels';
import { syncPlotEvidenceWithFiles } from '@/features/evidence/syncEvidenceWithFiles';
import { resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import {
  enqueuePendingSync,
  loadEvidenceForPlot,
  loadPlotServerLinks,
  loadPendingSyncActions,
  updatePlotEvidenceUri,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

export type ProducerSupportingDocType = {
  kind: PlotEvidenceKind;
  label: string;
};

export type ProducerDocSyncStatus =
  | 'on_tracebud'
  | 'on_phone'
  | 'queued'
  | 'sign_in_required'
  | 'needs_plot_sync';

const LEGACY_LABOR_LABELS = new Set(['labor_photo', PRODUCER_LABOR_FILE_LABEL]);

export function matchesProducerSupportingDocType(
  doc: PlotEvidenceItem,
  docType: ProducerSupportingDocType,
): boolean {
  if (docType.label === PRODUCER_COMMUNITY_FILE_LABEL) {
    return doc.kind === 'fpic_repository' && doc.label === PRODUCER_COMMUNITY_FILE_LABEL;
  }
  if (docType.label === PRODUCER_LABOR_FILE_LABEL) {
    return (
      doc.kind === 'labor_evidence' &&
      !isProducerAdditionalFile(doc) &&
      (doc.label === PRODUCER_LABOR_FILE_LABEL ||
        doc.label === 'labor_photo' ||
        LEGACY_LABOR_LABELS.has(String(doc.label ?? '')))
    );
  }
  if (docType.label === PRODUCER_ADDITIONAL_FILE_LABEL) {
    return isProducerAdditionalFile(doc);
  }
  return false;
}

export function groupProducerDocsByType(
  docs: readonly PlotEvidenceItem[],
  docType: ProducerSupportingDocType,
): PlotEvidenceItem[] {
  return docs.filter((doc) => matchesProducerSupportingDocType(doc, docType));
}

function producerScopeHasPendingEvidenceSync(
  actions: Awaited<ReturnType<typeof loadPendingSyncActions>>,
  farmerId: string,
): boolean {
  const scopeId = producerEvidenceScopeId(farmerId);
  return actions.some((row) => {
    if (row.actionType !== 'evidence_sync') return false;
    try {
      const payload = JSON.parse(row.payloadJson) as { plotId?: string; scope?: string };
      return payload.scope === 'producer' || payload.plotId === scopeId;
    } catch {
      return false;
    }
  });
}

export function resolveProducerDocSyncStatus(params: {
  item: PlotEvidenceItem;
  isSignedIn: boolean;
  hasSyncedPlot: boolean;
  pendingProducerSync: boolean;
}): ProducerDocSyncStatus {
  if (!isLocalEvidenceUri(params.item.uri)) {
    return 'on_tracebud';
  }
  if (!params.isSignedIn) {
    return 'sign_in_required';
  }
  if (!params.hasSyncedPlot) {
    return 'needs_plot_sync';
  }
  if (params.pendingProducerSync) {
    return 'queued';
  }
  return 'on_phone';
}

export function producerDocSyncStatusLabelKey(status: ProducerDocSyncStatus): string {
  switch (status) {
    case 'on_tracebud':
      return 'documents_supporting_status_on_tracebud';
    case 'queued':
      return 'documents_supporting_status_queued';
    case 'sign_in_required':
      return 'documents_supporting_status_sign_in';
    case 'needs_plot_sync':
      return 'documents_supporting_status_needs_plot';
    default:
      return 'documents_supporting_status_on_phone';
  }
}

export function producerDocSyncStatusBadgeVariant(
  status: ProducerDocSyncStatus,
): 'success' | 'warning' | 'info' | 'default' {
  if (status === 'on_tracebud') return 'success';
  if (status === 'queued' || status === 'needs_plot_sync') return 'warning';
  if (status === 'sign_in_required') return 'info';
  return 'default';
}

async function resolveProducerEvidenceAnchorPlot(params: {
  farmerId: string;
  localPlots: Plot[];
  backendPlots?: unknown[];
  plotServerLinks?: PlotServerLinks;
}): Promise<{ serverPlotId: string } | null> {
  const links = params.plotServerLinks ?? (await loadPlotServerLinks());
  const backendPlots =
    params.backendPlots ?? (await fetchPlotsForFarmer(params.farmerId).catch(() => []));
  for (const plot of params.localPlots) {
    const serverPlotId = resolveServerPlotIdForLocal(plot, backendPlots ?? [], links);
    if (serverPlotId) {
      return { serverPlotId };
    }
  }
  return null;
}

export type UploadProducerSupportingOutcome =
  | { status: 'uploaded'; uploadedCount: number }
  | { status: 'queued' }
  | { status: 'local_only'; reason: 'not_signed_in' | 'no_farmer' | 'no_documents' }
  | { status: 'skipped'; reason: 'no_pending' | 'no_anchor_plot' };

/** Upload local producer supporting files using the first synced plot as server anchor. */
export async function uploadProducerSupportingEvidence(params: {
  farmerId: string;
  localPlots: Plot[];
  backendPlots?: unknown[];
  plotServerLinks?: PlotServerLinks;
  customReason?: string | null;
}): Promise<UploadProducerSupportingOutcome> {
  if (!params.farmerId) {
    return { status: 'local_only', reason: 'no_farmer' };
  }
  const scopeId = producerEvidenceScopeId(params.farmerId);
  const items = (await loadEvidenceForPlot(scopeId)).filter((row) => isLocalEvidenceUri(row.uri));
  if (items.length === 0) {
    return { status: 'skipped', reason: 'no_pending' };
  }
  if (!hasSyncAuthSession()) {
    return { status: 'local_only', reason: 'not_signed_in' };
  }

  const anchor = await resolveProducerEvidenceAnchorPlot(params);
  const reason = resolveDocumentUploadReason(params.customReason);

  if (!anchor) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'evidence_sync',
      payloadJson: JSON.stringify({
        scope: 'producer',
        farmerId: params.farmerId,
        plotId: scopeId,
        reason,
      }),
      lastError: 'Upload a plot to Tracebud first (My Plots → Sync).',
    });
    return { status: 'queued' };
  }

  try {
    const summary = await syncPlotEvidenceWithFiles({
      localPlotId: scopeId,
      serverPlotId: anchor.serverPlotId,
      farmerId: params.farmerId,
      items,
      reason,
      note: 'Producer supporting documents from Documents tab',
      clientEventId: `producer-supporting-${Date.now()}`,
      onUriResolved: async (item, remoteUri) => {
        await updatePlotEvidenceUri(item.id, remoteUri);
      },
    });

    if (summary.uploadedCount > 0) {
      return { status: 'uploaded', uploadedCount: summary.uploadedCount };
    }
    if (summary.notSignedIn) {
      return { status: 'local_only', reason: 'not_signed_in' };
    }
    return { status: 'queued' };
  } catch {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: 'evidence_sync',
      payloadJson: JSON.stringify({
        scope: 'producer',
        farmerId: params.farmerId,
        plotId: scopeId,
        reason,
      }),
      lastError: 'Could not upload supporting files — try Settings → Sync now.',
    });
    return { status: 'queued' };
  }
}

export async function hasSyncedPlotForFarmer(params: {
  localPlots: Plot[];
  backendPlots?: unknown[];
  plotServerLinks?: PlotServerLinks;
  farmerId: string;
}): Promise<boolean> {
  const anchor = await resolveProducerEvidenceAnchorPlot(params);
  return anchor != null;
}

export async function producerSupportingHasPendingSync(farmerId: string): Promise<boolean> {
  const actions = await loadPendingSyncActions().catch(() => []);
  return producerScopeHasPendingEvidenceSync(actions, farmerId);
}
