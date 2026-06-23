import { probeTracebudApiReachable } from '@/features/network/pingTracebudApi';
import { postHarvestToBackend, syncPlotLegalToBackend } from '@/features/api/postPlot';
import { postAuditEventToBackend } from '@/features/api/audit';
import { markDeclarationAuditSynced, isDeclarationAuditSynced } from '@/features/sync/queueDeclarationAuditSync';
import { invalidateAuditFetchCache } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { markFieldCloudAuditSynced, isFieldCloudAuditSynced } from '@/features/sync/queueFieldCloudAuditSync';
import { fetchMergedServerPlots } from '@/features/sync/resolveFieldSyncScope';
import { fetchPlotsForFarmerCached } from '@/features/sync/serverPlotFetchCache';
import { syncLandTitlePhotosWithFiles } from '@/features/evidence/syncLandTitlePhotosWithFiles';
import { syncGroundTruthPhotosWithFiles } from '@/features/evidence/syncGroundTruthPhotosWithFiles';
import { syncPlotEvidenceWithFiles } from '@/features/evidence/syncEvidenceWithFiles';
import { readHarvestSubmitQrCodeRef } from '@/features/harvest/resolveDeliveryQrCode';
import { resolveServerPlotIdForLocal, reconcilePlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import {
  classifyQueueSyncFailure,
  type SyncFailure,
} from '@/features/sync/syncFailure';
import { isSyncFailureError } from '@/features/sync/syncFailureError';
import { reportSyncFailure } from '@/features/sync/reportSyncFailure';
import {
  deletePendingSyncAction,
  compactDuplicatePendingSyncActions,
  loadEvidenceForPlot,
  loadPendingSyncActions,
  loadPhotosForPlot,
  loadPlotServerLinks,
  loadTitlePhotosForPlot,
  logAuditEvent,
  markPendingSyncAttempt,
  persistPlotServerLinks,
  updateLocalDeliveryReceipt,
  updatePlotEvidenceUri,
  type PendingSyncAction,
} from '@/features/state/persistence';
import { compareHlcTimestamp, parseHlcTimestamp } from '@/features/sync/hlc';
import { comparePendingSyncActionsForDrain } from '@/features/sync/pendingSyncQueuePriority';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export type ProcessPendingSyncQueueResult = {
  /** Actions removed from the queue after successful API calls. */
  completed: number;
  /** Actions that hit an exception (still queued, attempts incremented). */
  failedActions: number;
  /** Malformed queue rows removed. */
  droppedInvalid: number;
  fetchFailed: boolean;
  firstError?: string;
  firstFailedActionType?: PendingSyncAction['actionType'];
  syncFailure?: SyncFailure;
};

export type PendingSyncAttemptScope = 'all' | 'retrying_only' | 'first_attempt_only';

const BASE_BACKOFF_MS = 5000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

function computeBackoffMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (attempts - 1));
}

function isEligibleForRetry(row: PendingSyncAction, nowMs: number): boolean {
  const attempts = row.attempts ?? 0;
  if (attempts <= 0) return true;
  const lastAttemptAt = row.lastAttemptAt ?? row.createdAt;
  const nextAllowedAt = lastAttemptAt + computeBackoffMs(attempts);
  return nowMs >= nextAllowedAt;
}

/**
 * Drains the SQLite pending sync queue (harvests, photo sync, evidence sync).
 * Fetches server plots once per run and uses the same local↔server matching as Home / My Plots.
 */
export async function processPendingSyncQueue(params: {
  farmerId: string;
  localPlots: Plot[];
  /** When set, merges server plots from every owned profile (auth uid vs linked farmer id). */
  farmerScopeIds?: string[];
  actionTypes?: PendingSyncAction['actionType'][];
  attemptScope?: PendingSyncAttemptScope;
  maxActions?: number;
  /** Manual Sync now — retry rows even if exponential backoff has not elapsed. */
  ignoreBackoff?: boolean;
  /** When Sync now already verified auth, skip a redundant token refresh during reachability probe. */
  accessToken?: string;
}): Promise<ProcessPendingSyncQueueResult> {
  await compactDuplicatePendingSyncActions().catch(() => 0);

  if (!params.accessToken?.trim()) {
    const apiReachable = await probeTracebudApiReachable();
    if (!apiReachable) {
      return {
        completed: 0,
        failedActions: 0,
        droppedInvalid: 0,
        fetchFailed: true,
        firstError: 'Network request failed',
      };
    }
  }

  let backendRows: unknown[] = [];
  let plotServerLinks: Record<string, string> = {};
  let plotListFetchFailed = false;
  const scopeIds = Array.from(
    new Set(
      [params.farmerId.trim(), ...(params.farmerScopeIds ?? []).map((id) => id.trim())].filter(
        Boolean,
      ),
    ),
  );
  try {
    plotServerLinks = await loadPlotServerLinks();
    backendRows =
      scopeIds.length > 1
        ? await fetchMergedServerPlots(scopeIds)
        : await fetchPlotsForFarmerCached(params.farmerId);
  } catch (e) {
    plotListFetchFailed = true;
    plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
    backendRows = [];
    const hasLinks = Object.keys(plotServerLinks).length > 0;
    const hasLocalPlots = params.localPlots.length > 0;
    if (!hasLinks && !hasLocalPlots) {
      return {
        completed: 0,
        failedActions: 0,
        droppedInvalid: 0,
        fetchFailed: true,
        firstError: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const reconciledLinks = reconcilePlotServerLinks(
    params.localPlots,
    backendRows,
    plotServerLinks,
  );
  if (Object.keys(reconciledLinks).length !== Object.keys(plotServerLinks).length ||
      Object.entries(reconciledLinks).some(([localId, serverId]) => plotServerLinks[localId] !== serverId)) {
    await persistPlotServerLinks(reconciledLinks).catch(() => undefined);
  }
  plotServerLinks = reconciledLinks;

  const resolveBackendPlotId = (localPlotId: string): string | null => {
    const trimmedId = localPlotId.trim();
    if (!trimmedId) return null;

    const directLink = plotServerLinks[trimmedId]?.trim();
    if (directLink) {
      if (backendRows.length === 0) {
        // Honor persisted links even when the scoped farmer list is empty (wrong device farmer id).
        return directLink;
      }
      if (
        (backendRows as { id?: unknown }[]).some(
          (row) => String(row?.id ?? '') === directLink,
        )
      ) {
        return directLink;
      }
    }

    const local = params.localPlots.find((p) => p.id === trimmedId);
    if (!local) {
      return directLink || null;
    }
    const hit = resolveServerPlotIdForLocal(
      {
        id: local.id,
        name: local.name,
        areaHectares: local.areaHectares,
        kind: local.kind,
      },
      backendRows,
      plotServerLinks,
    );
    return hit;
  };

  let completed = 0;
  let failedActions = 0;
  let droppedInvalid = 0;
  let firstError: string | undefined;
  let firstFailedActionType: PendingSyncAction['actionType'] | undefined;
  let firstSyncFailure: SyncFailure | undefined;

  const allowedActionTypes = params.actionTypes ?? ['harvest', 'photos_sync', 'evidence_sync', 'audit_sync'];
  const allowedActionTypeSet = new Set<PendingSyncAction['actionType']>(allowedActionTypes);
  const attemptScope = params.attemptScope ?? 'all';
  const ignoreBackoff = params.ignoreBackoff === true;
  const nowMs = Date.now();
  const scopedActions = (await loadPendingSyncActions())
    .filter((row) => allowedActionTypeSet.has(row.actionType))
    .filter((row) => {
      if (attemptScope === 'retrying_only') return (row.attempts ?? 0) > 0;
      if (attemptScope === 'first_attempt_only') return (row.attempts ?? 0) === 0;
      return true;
    })
    .filter((row) => ignoreBackoff || isEligibleForRetry(row, nowMs))
    .sort(comparePendingSyncActionsForDrain);
  const maxActions =
    params.maxActions != null && Number.isFinite(params.maxActions)
      ? Math.max(0, Math.floor(params.maxActions))
      : null;
  const actions = maxActions == null ? scopedActions : scopedActions.slice(0, maxActions);
  for (const a of actions) {
    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(a.payloadJson) as Record<string, unknown>;
    } catch {
      await deletePendingSyncAction(a.id);
      await logAuditEvent({
        eventType: 'sync_queue_action_dropped_invalid',
        payload: {
          pendingSyncId: a.id,
          actionType: a.actionType,
          reason: 'invalid_payload_json',
        },
      }).catch(() => undefined);
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
          failedActions += 1;
          firstError = firstError ?? 'Plot not on server yet — upload plot from My Plots first.';
          await markPendingSyncAttempt(a.id, {
            attempts: (a.attempts ?? 0) + 1,
            lastError: 'Plot not on server yet — upload plot from My Plots first.',
            lastAttemptAt: Date.now(),
          });
          continue;
        }
        const clientEventId =
          typeof payload?.clientEventId === 'string' && payload.clientEventId.trim().length > 0
            ? payload.clientEventId.trim()
            : `pending-sync-${a.id}`;
        const harvestResponse = await postHarvestToBackend({
          ...payload,
          farmerId: params.farmerId,
          plotId: sid,
          hlcTimestamp: a.hlcTimestamp,
          clientEventId,
        } as Parameters<typeof postHarvestToBackend>[0]);
        const qrCodeRef = readHarvestSubmitQrCodeRef(harvestResponse);
        await updateLocalDeliveryReceipt(clientEventId, {
          qrCodeRef,
          pendingSync: false,
          serverPlotId: sid,
        }).catch(() => undefined);
        trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_SUCCESS, {
          plotId: localId,
          serverPlotId: sid,
          source: 'sync_queue',
        });
      } else if (a.actionType === 'photos_sync') {
        const localId = String(payload?.plotId ?? '');
        const sid = resolveBackendPlotId(localId);
        if (!sid) {
          failedActions += 1;
          firstError = firstError ?? 'Plot not on server — upload from My Plots first.';
          await markPendingSyncAttempt(a.id, {
            attempts: (a.attempts ?? 0) + 1,
            lastError: 'Plot not on server — upload from My Plots first.',
            lastAttemptAt: Date.now(),
          });
          continue;
        }
        const kind = payload?.kind === 'land_title' ? 'land_title' : 'ground_truth';
        const legal = payload?.legal as
          | {
              cadastralKey?: string | null;
              informalTenure?: boolean | null;
              informalTenureNote?: string | null;
              reason?: string | null;
            }
          | undefined;
        if (legal?.reason && String(legal.reason).trim().length > 0) {
          await syncPlotLegalToBackend({
            plotId: sid,
            cadastralKey: legal.cadastralKey ?? null,
            informalTenure: legal.informalTenure ?? null,
            informalTenureNote: legal.informalTenureNote ?? null,
            reason: String(legal.reason).trim(),
            hlcTimestamp: a.hlcTimestamp,
            clientEventId: `pending-sync-${a.id}-legal`,
          });
        }
        if (kind === 'land_title') {
          const titlePhotos = await loadTitlePhotosForPlot(localId);
          const payloadPhotos = Array.isArray(payload.photos) ? payload.photos : [];
          const firstMeta = payloadPhotos[0] as Record<string, unknown> | undefined;
          await syncLandTitlePhotosWithFiles({
            serverPlotId: sid,
            farmerId: params.farmerId,
            photos: titlePhotos,
            cadastralKey:
              typeof firstMeta?.cadastralKey === 'string' ? firstMeta.cadastralKey : legal?.cadastralKey ?? null,
            informalTenure:
              typeof firstMeta?.informalTenure === 'boolean'
                ? firstMeta.informalTenure
                : legal?.informalTenure ?? null,
            informalTenureNote:
              typeof firstMeta?.informalTenureNote === 'string'
                ? firstMeta.informalTenureNote
                : legal?.informalTenureNote ?? null,
            note: typeof payload?.note === 'string' ? payload.note : 'Land title photos sync from pending queue',
            hlcTimestamp: a.hlcTimestamp,
            clientEventId: `pending-sync-${a.id}`,
          });
        } else {
          const groundPhotos = await loadPhotosForPlot(localId);
          await syncGroundTruthPhotosWithFiles({
            serverPlotId: sid,
            farmerId: params.farmerId,
            photos: groundPhotos,
            note:
              typeof payload?.note === 'string'
                ? payload.note
                : 'Ground truth photos sync from pending queue',
            hlcTimestamp: a.hlcTimestamp,
            clientEventId: `pending-sync-${a.id}`,
          });
        }
      } else if (a.actionType === 'evidence_sync') {
        const plotIdRaw = payload?.plotId as string | undefined;
        const reason = String(payload?.reason ?? '').trim();
        const scope = String(payload?.scope ?? '');
        const isProducerScope = scope === 'producer' || String(plotIdRaw ?? '').startsWith('profile:');

        let sid: string | null = null;
        if (isProducerScope) {
          for (const plot of params.localPlots) {
            sid = resolveBackendPlotId(plot.id);
            if (sid) break;
          }
        } else {
          sid = plotIdRaw ? resolveBackendPlotId(plotIdRaw) : null;
        }

        if (!plotIdRaw || !sid || reason.length === 0) {
          if (plotIdRaw && reason.length > 0 && !sid) {
            failedActions += 1;
            const blockedError = isProducerScope
              ? 'Upload a plot to Tracebud first (My Plots → Sync).'
              : 'Plot not on server — upload from My Plots first.';
            firstError = firstError ?? blockedError;
            await markPendingSyncAttempt(a.id, {
              attempts: (a.attempts ?? 0) + 1,
              lastError: blockedError,
              lastAttemptAt: Date.now(),
            });
          } else {
            await deletePendingSyncAction(a.id);
            await logAuditEvent({
              eventType: 'sync_queue_action_dropped_invalid',
              payload: {
                pendingSyncId: a.id,
                actionType: a.actionType,
                reason: 'missing_plot_or_reason',
              },
            }).catch(() => undefined);
            droppedInvalid += 1;
          }
          continue;
        }
        const items = await loadEvidenceForPlot(plotIdRaw);
        if (items.length === 0) {
          await deletePendingSyncAction(a.id);
          droppedInvalid += 1;
          continue;
        }
        await syncPlotEvidenceWithFiles({
          localPlotId: plotIdRaw,
          serverPlotId: sid,
          farmerId: params.farmerId,
          items,
          reason,
          note: isProducerScope
            ? 'Producer supporting documents sync from pending queue'
            : 'Evidence repository sync from pending queue',
          hlcTimestamp: a.hlcTimestamp,
          clientEventId: `pending-sync-${a.id}`,
          onUriResolved: async (item, remoteUri) => {
            await updatePlotEvidenceUri(item.id, remoteUri);
          },
        });
      } else if (a.actionType === 'audit_sync') {
        const eventType = String(payload?.eventType ?? '').trim();
        const auditPayload = payload?.payload;
        if (
          !eventType ||
          !auditPayload ||
          typeof auditPayload !== 'object' ||
          Array.isArray(auditPayload)
        ) {
          await deletePendingSyncAction(a.id);
          droppedInvalid += 1;
          continue;
        }
        const auditPayloadObj = auditPayload as Record<string, unknown>;
        const scopeId = String(auditPayloadObj.farmerId ?? '').trim();
        const alreadyDeclaration = await isDeclarationAuditSynced({
          eventType,
          payload: auditPayloadObj,
        }).catch(() => false);
        const alreadyCloud =
          scopeId.length > 0
            ? await isFieldCloudAuditSynced({ eventType, scopeId }).catch(() => false)
            : false;
        if (alreadyDeclaration || alreadyCloud) {
          await deletePendingSyncAction(a.id);
          completed += 1;
          continue;
        }
        const result = await postAuditEventToBackend({
          eventType,
          payload: auditPayload as Record<string, unknown>,
        });
        if (!result.ok) {
          throw new Error(result.message ?? result.reason ?? 'Declaration audit sync failed');
        }
        await markDeclarationAuditSynced({
          eventType,
          payload: auditPayload as Record<string, unknown>,
        });
        invalidateAuditFetchCache();
        if (scopeId) {
          await markFieldCloudAuditSynced({ eventType, scopeId });
        }
      } else {
        await deletePendingSyncAction(a.id);
        await logAuditEvent({
          eventType: 'sync_queue_action_dropped_invalid',
          payload: {
            pendingSyncId: a.id,
            actionType: a.actionType,
            reason: 'unknown_action_type',
          },
        }).catch(() => undefined);
        droppedInvalid += 1;
        continue;
      }
      await deletePendingSyncAction(a.id);
      await logAuditEvent({
        eventType: 'sync_queue_action_succeeded',
        payload: {
          pendingSyncId: a.id,
          actionType: a.actionType,
          attemptsBeforeSuccess: a.attempts ?? 0,
        },
      }).catch(() => undefined);
      completed += 1;
    } catch (e) {
      const nextAttempts = (a.attempts ?? 0) + 1;
      const failure = isSyncFailureError(e)
        ? { ...e.failure, actionType: e.failure.actionType ?? a.actionType }
        : classifyQueueSyncFailure({ error: e, actionType: a.actionType });
      const errorText = failure.message;
      failedActions += 1;
      firstError = firstError ?? errorText;
      firstFailedActionType = firstFailedActionType ?? a.actionType;
      firstSyncFailure = firstSyncFailure ?? failure;
      reportSyncFailure(failure, {
        pendingSyncId: a.id,
        source: 'sync_queue',
        attempts: nextAttempts,
      });
      await markPendingSyncAttempt(a.id, {
        attempts: nextAttempts,
        lastError: errorText,
        lastAttemptAt: Date.now(),
      });
      await logAuditEvent({
        eventType: 'sync_queue_action_failed',
        payload: {
          pendingSyncId: a.id,
          actionType: a.actionType,
          attempts: nextAttempts,
          error: errorText,
        },
      }).catch(() => undefined);
      if (failure.cause === 'rate_limit') {
        // Stop this pass; upload-phase drain runs audit rows separately afterward.
        break;
      }
    }
  }

  if (completed > 0) {
    trackEvent(ANALYTICS_EVENTS.SYNC_QUEUE_DRAINED, {
      completed,
      failedActions,
      droppedInvalid,
    });
  }

  const syncFailure =
    firstSyncFailure ??
    (firstError != null
      ? classifyQueueSyncFailure({
          error: firstError,
          actionType: firstFailedActionType,
        })
      : undefined);

  return {
    completed,
    failedActions,
    droppedInvalid,
    fetchFailed: plotListFetchFailed && completed === 0 && failedActions === 0 && droppedInvalid === 0,
    firstError:
      firstError ??
      (plotListFetchFailed ? 'Plot list could not be refreshed — used saved plot links.' : undefined),
    firstFailedActionType,
    syncFailure,
  };
}
