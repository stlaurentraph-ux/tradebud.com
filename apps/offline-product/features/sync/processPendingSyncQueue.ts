import {
  fetchPlotsForFarmer,
  postHarvestToBackend,
  syncPlotEvidenceToBackend,
  syncPlotPhotosToBackend,
} from '@/features/api/postPlot';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import type { Plot } from '@/features/state/AppStateContext';
import {
  deletePendingSyncAction,
  loadEvidenceForPlot,
  loadPendingSyncActions,
  logAuditEvent,
  markPendingSyncAttempt,
  type PlotEvidenceKind,
} from '@/features/state/persistence';
import { compareHlcTimestamp, parseHlcTimestamp } from '@/features/sync/hlc';

const EVIDENCE_KINDS: PlotEvidenceKind[] = [
  'fpic_repository',
  'protected_area_permit',
  'labor_evidence',
  'tenure_evidence',
];

export type ProcessPendingSyncQueueResult = {
  /** Actions removed from the queue after successful API calls. */
  completed: number;
  /** Actions that hit an exception (still queued, attempts incremented). */
  failedActions: number;
  /** Malformed queue rows removed. */
  droppedInvalid: number;
  fetchFailed: boolean;
  firstError?: string;
};

/**
 * Drains the SQLite pending sync queue (harvests, photo sync, evidence sync).
 * Fetches server plots once per run and uses the same local↔server matching as Home / My Plots.
 */
export async function processPendingSyncQueue(params: {
  farmerId: string;
  localPlots: Plot[];
}): Promise<ProcessPendingSyncQueueResult> {
  let backendRows: unknown[] = [];
  try {
    backendRows = await fetchPlotsForFarmer(params.farmerId);
  } catch {
    return {
      completed: 0,
      failedActions: 0,
      droppedInvalid: 0,
      fetchFailed: true,
    };
  }

  const resolveBackendPlotId = (localPlotId: string): string | null => {
    const local = params.localPlots.find((p) => p.id === localPlotId);
    if (!local) return null;
    const hit = findBackendPlotForLocal(local, backendRows);
    return hit != null && (hit as { id?: unknown }).id != null
      ? String((hit as { id: unknown }).id)
      : null;
  };

  let completed = 0;
  let failedActions = 0;
  let droppedInvalid = 0;
  let firstError: string | undefined;

  const actions = (await loadPendingSyncActions()).sort((a, b) => {
    const cmp = compareHlcTimestamp(a.hlcTimestamp, b.hlcTimestamp);
    if (cmp !== 0) return cmp;
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  for (const a of actions) {
    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(a.payloadJson) as Record<string, unknown>;
    } catch {
      await deletePendingSyncAction(a.id);
      droppedInvalid += 1;
      continue;
    }

    try {
      if (!parseHlcTimestamp(a.hlcTimestamp)) {
        await logAuditEvent({
          eventType: 'sync_hlc_fallback_applied',
          payload: {
            pendingSyncId: a.id,
            actionType: a.actionType,
            fallback: 'createdAt_ingestion_order',
            invalidHlcTimestamp: a.hlcTimestamp,
          },
        });
      }

      if (a.actionType === 'harvest') {
        const localId = String(payload?.plotId ?? '');
        const sid = resolveBackendPlotId(localId);
        if (!sid) {
          await markPendingSyncAttempt(a.id, {
            attempts: (a.attempts ?? 0) + 1,
            lastError: 'Plot not on server yet — upload plot from My Plots first.',
          });
          continue;
        }
        await postHarvestToBackend({ ...payload, plotId: sid, hlcTimestamp: a.hlcTimestamp, clientEventId: `pending-sync-${a.id}` } as Parameters<
          typeof postHarvestToBackend
        >[0]);
      } else if (a.actionType === 'photos_sync') {
        const localId = String(payload?.plotId ?? '');
        const sid = resolveBackendPlotId(localId);
        if (!sid) {
          await markPendingSyncAttempt(a.id, {
            attempts: (a.attempts ?? 0) + 1,
            lastError: 'Plot not on server — upload from My Plots first.',
          });
          continue;
        }
        await syncPlotPhotosToBackend({ ...payload, plotId: sid, hlcTimestamp: a.hlcTimestamp, clientEventId: `pending-sync-${a.id}` } as Parameters<
          typeof syncPlotPhotosToBackend
        >[0]);
      } else if (a.actionType === 'evidence_sync') {
        const plotIdRaw = payload?.plotId as string | undefined;
        const reason = String(payload?.reason ?? '').trim();
        const sid = plotIdRaw ? resolveBackendPlotId(plotIdRaw) : null;
        if (!plotIdRaw || !sid || reason.length === 0) {
          if (plotIdRaw && reason.length > 0 && !sid) {
            await markPendingSyncAttempt(a.id, {
              attempts: (a.attempts ?? 0) + 1,
              lastError: 'Plot not on server — upload from My Plots first.',
            });
          } else {
            await deletePendingSyncAction(a.id);
            droppedInvalid += 1;
          }
          continue;
        }
        const items = await loadEvidenceForPlot(plotIdRaw);
        for (const k of EVIDENCE_KINDS) {
          const subset = items
            .filter((ev) => ev.kind === k)
            .map((ev) => ({
              kind: ev.kind,
              uri: ev.uri,
              label: ev.label ?? null,
              mimeType: ev.mimeType ?? null,
              takenAt: ev.takenAt,
            }));
          if (subset.length === 0) continue;
          await syncPlotEvidenceToBackend({
            plotId: sid,
            kind: k,
            items: subset,
            reason,
            note: 'Evidence repository sync from pending queue',
            hlcTimestamp: a.hlcTimestamp,
            clientEventId: `pending-sync-${a.id}-${k}`,
          });
        }
      } else {
        await deletePendingSyncAction(a.id);
        droppedInvalid += 1;
        continue;
      }
      await deletePendingSyncAction(a.id);
      completed += 1;
    } catch (e) {
      failedActions += 1;
      firstError = firstError ?? (e instanceof Error ? e.message : String(e));
      await markPendingSyncAttempt(a.id, {
        attempts: (a.attempts ?? 0) + 1,
        lastError: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    completed,
    failedActions,
    droppedInvalid,
    fetchFailed: false,
    firstError,
  };
}
