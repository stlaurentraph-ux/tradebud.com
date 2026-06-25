import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import {
  FARMER_PROFILE_PHOTO_AUDIT,
  PLOT_MAPPING_DRAFT_AUDIT,
  PLOT_MAPPING_DRAFT_CLEARED_AUDIT,
} from '@/features/sync/farmerArtifactRegistry';

export type PhotoAuditPayload = {
  storagePath?: string;
  uri?: string;
};

/** Latest plot_photos_synced audit counts per kind (one event per server plot). */
export function countServerPhotosFromAudit(auditRows: readonly AuditLogRow[]): {
  groundTruth: number;
  landTitle: number;
} {
  const latestGround = new Map<string, number>();
  const latestLand = new Map<string, number>();

  for (const row of auditRows) {
    if (row.event_type !== 'plot_photos_synced' || !row.payload) continue;
    const kind = row.payload.kind;
    if (kind !== 'ground_truth' && kind !== 'land_title') continue;
    const serverPlotId = String(row.payload.plotId ?? '').trim();
    if (!serverPlotId) continue;
    const target = kind === 'ground_truth' ? latestGround : latestLand;
    if (target.has(serverPlotId)) continue;
    const photos = row.payload.photos;
    if (!Array.isArray(photos) || photos.length === 0) continue;
    target.set(serverPlotId, photos.length);
  }

  let groundTruth = 0;
  let landTitle = 0;
  for (const n of latestGround.values()) groundTruth += n;
  for (const n of latestLand.values()) landTitle += n;
  return { groundTruth, landTitle };
}

export function serverHasProfilePhotoAudit(auditRows: readonly AuditLogRow[]): boolean {
  const latest = auditRows.find((row) => row.event_type === FARMER_PROFILE_PHOTO_AUDIT);
  if (!latest?.payload) return false;
  if (latest.payload.cleared === true) return false;
  return Boolean(String(latest.payload.storagePath ?? '').trim());
}

export function serverHasActiveWalkDraft(auditRows: readonly AuditLogRow[]): boolean {
  let savedMs = 0;
  let clearedMs = 0;
  for (const row of auditRows) {
    const ms = Date.parse(String(row.timestamp ?? '')) || 0;
    if (row.event_type === PLOT_MAPPING_DRAFT_AUDIT && ms >= savedMs) {
      savedMs = ms;
    }
    if (row.event_type === PLOT_MAPPING_DRAFT_CLEARED_AUDIT && ms >= clearedMs) {
      clearedMs = ms;
    }
  }
  return savedMs > clearedMs;
}

export function countServerDeclarationSignals(auditRows: readonly AuditLogRow[]): {
  producerAudit: boolean;
  plotAttestations: number;
  legalSynced: number;
} {
  const producerAudit = auditRows.some((row) => row.event_type === 'producer_attestations_updated');
  const plotIds = new Set<string>();
  let legalSynced = 0;
  for (const row of auditRows) {
    if (row.event_type === 'plot_compliance_declared') {
      const plotId = String(row.payload?.plotId ?? '').trim();
      if (plotId) plotIds.add(plotId);
    }
    if (row.event_type === 'plot_legal_synced') {
      legalSynced += 1;
    }
  }
  return { producerAudit, plotAttestations: plotIds.size, legalSynced };
}

/** Restorable declaration gaps on this device (not raw server audit totals). */
export function measureDeclarationParityMissing(params: {
  auditRows: readonly AuditLogRow[];
  localPlots: Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots?: unknown[];
  localFarmer?: FarmerProfile;
}): {
  producerMissingOnDevice: boolean;
  plotAttestationsMissingOnDevice: number;
} {
  const producerMissingOnDevice =
    !hasProducerAttestationsComplete(params.localFarmer) &&
    params.auditRows.some((row) => row.event_type === 'producer_attestations_updated');

  const serverDeclaredPlotIds = new Set<string>();
  for (const row of params.auditRows) {
    if (row.event_type !== 'plot_compliance_declared') continue;
    const plotId = String(row.payload?.plotId ?? '').trim();
    if (plotId) serverDeclaredPlotIds.add(plotId);
  }

  let plotAttestationsMissingOnDevice = 0;
  for (const plot of params.localPlots) {
    if (plot.landTenureDeclared && plot.noDeforestationDeclared) continue;
    const linkedServerId = params.plotServerLinks[plot.id]?.trim();
    const hasServerAudit =
      serverDeclaredPlotIds.has(plot.id) ||
      (linkedServerId ? serverDeclaredPlotIds.has(linkedServerId) : false) ||
      [...serverDeclaredPlotIds].some((serverPlotId) =>
        resolveLocalPlotIdForServerPlot({
          serverPlotId,
          localPlots: params.localPlots,
          plotServerLinks: params.plotServerLinks,
          backendPlots: params.backendPlots ?? [],
        }) === plot.id,
      );
    if (hasServerAudit) plotAttestationsMissingOnDevice += 1;
  }

  return { producerMissingOnDevice, plotAttestationsMissingOnDevice };
}

export function gapCount(server: number | null, local: number): number {
  if (server == null) return 0;
  return Math.max(0, server - local);
}
