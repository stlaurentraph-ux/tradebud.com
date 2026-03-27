// Web fallback: no SQLite (native-only). Keep minimal in-memory behavior.

import type { FarmerProfile, Plot } from './AppStateContext';

export type PlotPhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlotTitlePhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
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
};

export type PlotTenure = {
  plotId: string;
  informalTenure: boolean;
  informalTenureNote: string | null;
};

export type PendingSyncAction = {
  id: number;
  createdAt: number;
  actionType: 'harvest' | 'photos_sync' | 'evidence_sync';
  payloadJson: string;
  attempts: number;
  lastError: string | null;
};

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
let memLegal: Record<string, { cadastralKey?: string | null; tenure?: PlotTenure }> = {};
let memAudit: LocalAuditEvent[] = [];
let memPending: PendingSyncAction[] = [];
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

export async function loadPhotosForPlot(plotId: string): Promise<PlotPhoto[]> {
  return memPhotos.filter((p) => p.plotId === plotId);
}

export async function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>) {
  memTitlePhotos.unshift({ id: nextId(), ...photo });
}

export async function loadTitlePhotosForPlot(plotId: string): Promise<PlotTitlePhoto[]> {
  return memTitlePhotos.filter((p) => p.plotId === plotId);
}

export async function savePlotCadastralKey(plotId: string, cadastralKey: string | null) {
  memLegal[plotId] = { ...(memLegal[plotId] ?? {}), cadastralKey };
}

export async function loadPlotCadastralKey(plotId: string): Promise<string | null> {
  return memLegal[plotId]?.cadastralKey ?? null;
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

export async function enqueuePendingSync(action: Omit<PendingSyncAction, 'id' | 'attempts'>) {
  memPending.push({ id: nextId(), attempts: 0, ...action });
}

export async function loadPendingSyncActions(): Promise<PendingSyncAction[]> {
  return memPending;
}

export async function markPendingSyncAttempt(id: number, params: { attempts: number; lastError: string | null }) {
  memPending = memPending.map((a) => (a.id === id ? { ...a, ...params } : a));
}

export async function deletePendingSyncAction(id: number) {
  memPending = memPending.filter((a) => a.id !== id);
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

