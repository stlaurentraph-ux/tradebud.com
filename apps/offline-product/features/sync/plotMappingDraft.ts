import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  PLOT_MAPPING_DRAFT_AUDIT,
  PLOT_MAPPING_DRAFT_CLEARED_AUDIT,
} from '@/features/sync/farmerArtifactRegistry';
import { queueFieldCloudAuditSync } from '@/features/sync/queueFieldCloudAuditSync';
import {
  clearPlotMappingDraft,
  loadPlotMappingDraft,
  persistPlotMappingDraft,
  type PlotMappingDraftRow,
} from '@/features/state/persistence';

export type PlotMappingDraftPayload = {
  farmerId: string;
  editPlotId?: string | null;
  plotName?: string | null;
  captureMethod?: string | null;
  isRecording?: boolean;
  drawTracingActive?: boolean;
  points: Array<{ latitude: number; longitude: number; timestamp?: number }>;
  updatedAt: number;
};

export type RestorePlotMappingDraftResult = {
  restored: boolean;
  fetchFailed: boolean;
  cleared: boolean;
};

export function draftRowToPayload(row: PlotMappingDraftRow): PlotMappingDraftPayload {
  return {
    farmerId: row.farmerId,
    editPlotId: row.editPlotId,
    plotName: row.plotName,
    captureMethod: row.captureMethod,
    isRecording: row.isRecording,
    drawTracingActive: row.drawTracingActive,
    points: row.points,
    updatedAt: row.updatedAt,
  };
}

export async function queuePlotMappingDraftSync(
  draft: PlotMappingDraftRow,
): Promise<'synced' | 'queued' | 'skipped'> {
  if (!draft.farmerId?.trim() || draft.points.length === 0) return 'skipped';
  return queueFieldCloudAuditSync({
    eventType: PLOT_MAPPING_DRAFT_AUDIT,
    scopeId: draft.farmerId,
    payload: draftRowToPayload(draft) as unknown as Record<string, unknown>,
  });
}

export async function queuePlotMappingDraftClearSync(
  farmerId: string,
): Promise<'synced' | 'queued' | 'skipped'> {
  const id = farmerId.trim();
  if (!id) return 'skipped';
  await clearPlotMappingDraft(id).catch(() => undefined);
  return queueFieldCloudAuditSync({
    eventType: PLOT_MAPPING_DRAFT_CLEARED_AUDIT,
    scopeId: id,
    payload: { farmerId: id, clearedAt: Date.now() },
  });
}

export async function restorePlotMappingDraftFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
}): Promise<RestorePlotMappingDraftResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { restored: false, fetchFailed: false, cleared: false };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer(
      [apiFarmerId, ...params.ownedFarmerIds],
      100,
      [PLOT_MAPPING_DRAFT_AUDIT, PLOT_MAPPING_DRAFT_CLEARED_AUDIT],
    );
  } catch {
    return { restored: false, fetchFailed: true, cleared: false };
  }

  const latestClear = auditRows.find((row) => row.event_type === PLOT_MAPPING_DRAFT_CLEARED_AUDIT);
  const latestDraft = auditRows.find((row) => row.event_type === PLOT_MAPPING_DRAFT_AUDIT);

  const clearMs = latestClear?.timestamp ? Date.parse(String(latestClear.timestamp)) : 0;
  const draftMs = latestDraft?.timestamp ? Date.parse(String(latestDraft.timestamp)) : 0;

  if (latestClear && (!latestDraft || clearMs >= draftMs)) {
    await clearPlotMappingDraft(apiFarmerId);
    return { restored: false, fetchFailed: false, cleared: true };
  }

  if (!latestDraft?.payload) {
    return { restored: false, fetchFailed: false, cleared: false };
  }

  const payload = latestDraft.payload as PlotMappingDraftPayload;
  const points = Array.isArray(payload.points) ? payload.points : [];
  if (points.length === 0) {
    return { restored: false, fetchFailed: false, cleared: false };
  }

  const local = await loadPlotMappingDraft(apiFarmerId).catch(() => null);
  if (local && local.updatedAt >= (payload.updatedAt ?? 0)) {
    return { restored: false, fetchFailed: false, cleared: false };
  }

  await persistPlotMappingDraft({
    farmerId: apiFarmerId,
    editPlotId: payload.editPlotId ?? null,
    plotName: payload.plotName ?? null,
    captureMethod: payload.captureMethod ?? null,
    isRecording: payload.isRecording === true,
    drawTracingActive: payload.drawTracingActive === true,
    points: points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp,
    })),
    updatedAt: payload.updatedAt ?? Date.now(),
  });

  return { restored: true, fetchFailed: false, cleared: false };
}

export async function saveAndSyncPlotMappingDraft(draft: PlotMappingDraftRow): Promise<void> {
  await persistPlotMappingDraft(draft);
  if (draft.points.length === 0) {
    await queuePlotMappingDraftClearSync(draft.farmerId).catch(() => undefined);
    return;
  }
  await queuePlotMappingDraftSync(draft).catch(() => undefined);
}
