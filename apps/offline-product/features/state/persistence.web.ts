// Web fallback: no SQLite (native-only). Keep minimal in-memory behavior.

import type { FarmerProfile, Plot } from './AppStateContext';
import { generateHlcTimestamp } from '@/features/sync/hlc';
import {
  pendingSyncDedupKey,
  planPendingSyncCompaction,
} from '@/features/sync/pendingSyncDedup';

export type PlotPhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  latitude?: number | null;
  longitude?: number | null;
  direction?: 'north' | 'east' | 'south' | 'west' | null;
};

export type PlotTitlePhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  storagePath?: string | null;
};

export type PlotEvidenceKind =
  | 'fpic_repository'
  | 'protected_area_permit'
  | 'labor_evidence'
  | 'tenure_evidence';

export type PlotEvidenceItem = {
  id: number;
  plotId: string;
  kind: PlotEvidenceKind;
  uri: string;
  mimeType: string | null;
  label: string | null;
  takenAt: number;
  storagePath?: string | null;
};

export type PlotTenure = {
  plotId: string;
  informalTenure: boolean;
  informalTenureNote: string | null;
};

export type PendingSyncAction = {
  id: number;
  createdAt: number;
  hlcTimestamp: string;
  actionType:
    | 'harvest'
    | 'photos_sync'
    | 'evidence_sync'
    | 'audit_sync'
    | 'consent_approve'
    | 'consent_deny'
    | 'consent_revoke';
  payloadJson: string;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: number | null;
};

const MAX_PENDING_SYNC_ACTIONS = 1000;

export type LocalAuditEvent = {
  id: number;
  timestamp: number;
  userId: string | null;
  deviceId: string | null;
  eventType: string;
  payload: any;
};

let memFarmer: FarmerProfile | undefined;
let memPlots: Plot[] = [];
let memPhotos: PlotPhoto[] = [];
let memTitlePhotos: PlotTitlePhoto[] = [];
let memEvidence: PlotEvidenceItem[] = [];
let memLegal: Record<string, { cadastralKey?: string | null; serverPlotId?: string | null; tenure?: PlotTenure }> = {};
let memAudit: LocalAuditEvent[] = [];
let memPending: PendingSyncAction[] = [];
let memLocalDeliveryReceipts: LocalDeliveryReceiptRow[] = [];
let memSettings: Record<string, string> = {};

let seq = 1;
const nextId = () => seq++;

export async function initDatabase() {}

export async function loadAppState(): Promise<{ farmer?: FarmerProfile; plots: Plot[] }> {
  const photoUri = memSettings['farmerProfilePhotoUri'];
  if (memFarmer && photoUri && photoUri.length > 0) {
    return { farmer: { ...memFarmer, profilePhotoUri: photoUri }, plots: memPlots };
  }
  return { farmer: memFarmer, plots: memPlots };
}

export async function persistFarmer(farmer?: FarmerProfile) {
  memFarmer = farmer;
}

export async function persistPlots(plots: Plot[]) {
  memPlots = plots;
}

export async function logAuditEvent(params: { userId?: string; eventType: string; payload: Record<string, unknown> }) {
  memAudit.unshift({
    id: nextId(),
    timestamp: Date.now(),
    userId: params.userId ?? null,
    deviceId: 'web',
    eventType: params.eventType,
    payload: params.payload,
  });
}

export async function loadLocalAuditEvents(params?: { limit?: number }): Promise<LocalAuditEvent[]> {
  return memAudit.slice(0, params?.limit ?? 50);
}

export async function persistPlotPhoto(photo: Omit<PlotPhoto, 'id'>) {
  memPhotos.unshift({ id: nextId(), ...photo });
}

export async function upsertPlotGroundPhoto(photo: Omit<PlotPhoto, 'id'>) {
  if (photo.direction) {
    memPhotos = memPhotos.filter(
      (p) => !(p.plotId === photo.plotId && p.direction === photo.direction),
    );
  }
  await persistPlotPhoto(photo);
}

export async function loadPhotosForPlot(plotId: string): Promise<PlotPhoto[]> {
  return memPhotos.filter((p) => p.plotId === plotId);
}

export async function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>): Promise<number> {
  const id = nextId();
  memTitlePhotos.unshift({ id, ...photo });
  return id;
}

export async function updatePlotTitlePhotoAfterUpload(
  photoId: number,
  params: { uri: string; storagePath: string },
): Promise<void> {
  memTitlePhotos = memTitlePhotos.map((row) =>
    row.id === photoId ? { ...row, uri: params.uri, storagePath: params.storagePath } : row,
  );
}

export async function loadTitlePhotosForPlot(plotId: string): Promise<PlotTitlePhoto[]> {
  return memTitlePhotos.filter((p) => p.plotId === plotId);
}

export async function deletePlotTitlePhoto(photoId: number): Promise<void> {
  memTitlePhotos = memTitlePhotos.filter((p) => p.id !== photoId);
}

export function isPlotTitlePhotoPendingUpload(photo: Pick<PlotTitlePhoto, 'storagePath'>): boolean {
  return !photo.storagePath?.trim();
}

export async function deletePlotEvidenceItem(evidenceId: number): Promise<void> {
  memEvidence = memEvidence.filter((e) => e.id !== evidenceId);
}

export async function updatePlotEvidenceUri(evidenceId: number, uri: string): Promise<void> {
  memEvidence = memEvidence.map((row) => (row.id === evidenceId ? { ...row, uri } : row));
}

export async function updatePlotEvidenceAfterUpload(
  evidenceId: number,
  params: { uri: string; storagePath: string },
): Promise<void> {
  memEvidence = memEvidence.map((row) =>
    row.id === evidenceId
      ? { ...row, uri: params.uri, storagePath: params.storagePath }
      : row,
  );
}

export async function savePlotCadastralKey(plotId: string, cadastralKey: string | null) {
  memLegal[plotId] = { ...(memLegal[plotId] ?? {}), cadastralKey };
}

export async function loadPlotCadastralKey(plotId: string): Promise<string | null> {
  return memLegal[plotId]?.cadastralKey ?? null;
}

export async function savePlotServerLink(localPlotId: string, serverPlotId: string): Promise<void> {
  const trimmed = serverPlotId.trim();
  if (!trimmed) return;
  memLegal[localPlotId] = { ...(memLegal[localPlotId] ?? {}), serverPlotId: trimmed };
}

export async function loadPlotServerLinks(): Promise<Record<string, string>> {
  const links: Record<string, string> = {};
  for (const [plotId, row] of Object.entries(memLegal)) {
    if (row.serverPlotId?.trim()) {
      links[plotId] = row.serverPlotId.trim();
    }
  }
  return links;
}

export async function persistPlotServerLinks(links: Record<string, string>): Promise<void> {
  for (const [localPlotId, serverPlotId] of Object.entries(links)) {
    await savePlotServerLink(localPlotId, serverPlotId);
  }
}

export async function savePlotTenure(plotId: string, params: { informalTenure: boolean; informalTenureNote: string | null }) {
  memLegal[plotId] = { ...(memLegal[plotId] ?? {}), tenure: { plotId, ...params } };
}

export async function loadPlotTenure(plotId: string): Promise<PlotTenure> {
  return memLegal[plotId]?.tenure ?? { plotId, informalTenure: false, informalTenureNote: null };
}

export async function persistPlotEvidenceItem(item: Omit<PlotEvidenceItem, 'id'>) {
  memEvidence.unshift({ id: nextId(), ...item });
}

export async function loadEvidenceForPlot(plotId: string, kind?: PlotEvidenceKind): Promise<PlotEvidenceItem[]> {
  return memEvidence.filter((e) => e.plotId === plotId && (!kind || e.kind === kind));
}

export async function compactDuplicatePendingSyncActions(): Promise<number> {
  const { deleteIds } = planPendingSyncCompaction(memPending);
  if (deleteIds.length === 0) return 0;
  const drop = new Set(deleteIds);
  memPending = memPending.filter((row) => !drop.has(row.id));
  return deleteIds.length;
}

export async function enqueuePendingSync(
  action: Omit<PendingSyncAction, 'id' | 'attempts' | 'hlcTimestamp' | 'lastAttemptAt'> & { hlcTimestamp?: string },
) {
  const dedupKey = pendingSyncDedupKey(action.actionType, action.payloadJson);
  if (dedupKey) {
    const existing = memPending.find(
      (row) => pendingSyncDedupKey(row.actionType, row.payloadJson) === dedupKey,
    );
    if (existing) {
      existing.payloadJson = action.payloadJson;
      existing.lastError = action.lastError ?? existing.lastError;
      return;
    }
  }

  const previous = memPending.length > 0 ? memPending[memPending.length - 1].hlcTimestamp : null;
  memPending.push({
    id: nextId(),
    attempts: 0,
    ...action,
    hlcTimestamp: generateHlcTimestamp(action.createdAt, action.hlcTimestamp ?? previous),
    lastAttemptAt: null,
  });
  if (memPending.length > MAX_PENDING_SYNC_ACTIONS) {
    memPending = memPending.slice(memPending.length - MAX_PENDING_SYNC_ACTIONS);
  }
}

export async function loadPendingSyncActions(): Promise<PendingSyncAction[]> {
  return memPending;
}

export async function markPendingSyncAttempt(
  id: number,
  params: { attempts: number; lastError: string | null; lastAttemptAt?: number | null },
) {
  memPending = memPending.map((a) =>
    a.id === id ? { ...a, ...params, lastAttemptAt: params.lastAttemptAt ?? Date.now() } : a,
  );
}

export async function deletePendingSyncAction(id: number) {
  memPending = memPending.filter((a) => a.id !== id);
}

export type LocalDeliveryReceiptRow = {
  id: string;
  farmerId: string;
  localPlotId: string;
  serverPlotId: string | null;
  plotName: string;
  kg: number;
  recordedAt: number;
  qrCodeRef: string | null;
  pendingSync: boolean;
  buyerLabel: string;
};

export async function persistLocalDeliveryReceipt(row: LocalDeliveryReceiptRow): Promise<void> {
  memLocalDeliveryReceipts = [
    row,
    ...memLocalDeliveryReceipts.filter((existing) => existing.id !== row.id),
  ];
}

export async function loadLocalDeliveryReceiptsForFarmer(
  farmerId: string,
): Promise<LocalDeliveryReceiptRow[]> {
  const scoped = memLocalDeliveryReceipts
    .filter((row) => row.farmerId === farmerId)
    .sort((a, b) => b.recordedAt - a.recordedAt);
  if (scoped.length > 0) {
    return scoped;
  }
  return [...memLocalDeliveryReceipts].sort((a, b) => b.recordedAt - a.recordedAt);
}

export async function updateLocalDeliveryReceipt(
  id: string,
  patch: Partial<Pick<LocalDeliveryReceiptRow, 'qrCodeRef' | 'pendingSync' | 'serverPlotId'>>,
): Promise<void> {
  memLocalDeliveryReceipts = memLocalDeliveryReceipts.map((row) =>
    row.id === id
      ? {
          ...row,
          qrCodeRef: patch.qrCodeRef !== undefined ? patch.qrCodeRef : row.qrCodeRef,
          pendingSync: patch.pendingSync !== undefined ? patch.pendingSync : row.pendingSync,
          serverPlotId: patch.serverPlotId !== undefined ? patch.serverPlotId : row.serverPlotId,
        }
      : row,
  );
}

export async function getSetting(key: string): Promise<string | null> {
  return memSettings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  memSettings[key] = value;
}

export async function deleteSetting(key: string): Promise<void> {
  delete memSettings[key];
}

export async function saveFarmerProfilePhotoUri(uri: string | null): Promise<void> {
  if (uri == null || uri === '') {
    delete memSettings['farmerProfilePhotoUri'];
  } else {
    memSettings['farmerProfilePhotoUri'] = uri;
  }
}

export async function deletePlotLocalData(plotId: string): Promise<void> {
  memPhotos = memPhotos.filter((p) => p.plotId !== plotId);
  memTitlePhotos = memTitlePhotos.filter((p) => p.plotId !== plotId);
  memEvidence = memEvidence.filter((e) => e.plotId !== plotId);
  delete memLegal[plotId];
  memPending = memPending.filter((a) => !a.payloadJson.includes(`"plotId":"${plotId}"`));
}

