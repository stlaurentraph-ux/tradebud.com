import { fetchFieldSyncDelta, type FieldSyncDeltaResponse } from '@/features/api/fieldSyncDelta';
import { persistGeometrySyncMinTier } from '@/features/compliance/tenantGeometrySyncPolicy';
import { getSetting, setSetting } from '@/features/state/persistence';
import {
  buildFieldSyncCursorSnapshot,
  buildFieldSyncInboundChangeSet,
  fieldSyncDeltaHasInboundChanges,
  type FieldSyncCursorSnapshot,
  type FieldSyncInboundChangeSet,
} from '@/features/sync/fieldSyncDeltaEvaluate';

export const FIELD_SYNC_CURSOR_SETTING_KEY = 'field_sync_cursor_v1';

export async function loadFieldSyncCursorSnapshot(): Promise<FieldSyncCursorSnapshot | null> {
  const raw = await getSetting(FIELD_SYNC_CURSOR_SETTING_KEY);
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as FieldSyncCursorSnapshot;
    if (!Number.isFinite(parsed.cursorMs) || parsed.cursorMs <= 0) return null;
    if (typeof parsed.voucherFingerprint !== 'string') return null;
    if (!parsed.auditByFarmer || typeof parsed.auditByFarmer !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveFieldSyncCursorSnapshot(snapshot: FieldSyncCursorSnapshot): Promise<void> {
  await setSetting(FIELD_SYNC_CURSOR_SETTING_KEY, JSON.stringify(snapshot));
}

export async function clearFieldSyncCursor(): Promise<void> {
  await setSetting(FIELD_SYNC_CURSOR_SETTING_KEY, '');
}

export type FieldSyncDeltaProbeResult = {
  hasInboundChanges: boolean;
  hasCursor: boolean;
  delta: FieldSyncDeltaResponse | null;
  snapshot: FieldSyncCursorSnapshot | null;
  changeSet: FieldSyncInboundChangeSet | null;
  probeFailed: boolean;
};

export async function probeFieldSyncInboundChanges(params?: {
  accessToken?: string;
}): Promise<FieldSyncDeltaProbeResult> {
  const snapshot = await loadFieldSyncCursorSnapshot();
  const hasCursor = snapshot != null;
  try {
    const delta = await fetchFieldSyncDelta(snapshot?.cursorMs, params?.accessToken);
    const hasInboundChanges = fieldSyncDeltaHasInboundChanges(delta, snapshot);
    const changeSet =
      snapshot != null ? buildFieldSyncInboundChangeSet(delta, snapshot) : null;
    return { hasInboundChanges, hasCursor, delta, snapshot, changeSet, probeFailed: false };
  } catch {
    return {
      hasInboundChanges: true,
      hasCursor,
      delta: null,
      snapshot,
      changeSet: null,
      probeFailed: true,
    };
  }
}

export async function persistFieldSyncCursorFromDelta(delta: FieldSyncDeltaResponse): Promise<void> {
  if (delta.geometrySyncMinTier) {
    await persistGeometrySyncMinTier(delta.geometrySyncMinTier);
  }
  await saveFieldSyncCursorSnapshot(buildFieldSyncCursorSnapshot(delta));
}

export async function persistFieldSyncCursorAfterPipeline(accessToken: string): Promise<void> {
  const snapshot = await loadFieldSyncCursorSnapshot();
  const delta = await fetchFieldSyncDelta(snapshot?.cursorMs, accessToken);
  await persistFieldSyncCursorFromDelta(delta);
}
