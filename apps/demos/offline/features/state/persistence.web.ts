/**
 * Web demo persistence: localStorage snapshot so `expo export --platform web` never loads expo-sqlite (WASM).
 */

import type { FarmerProfile, Plot } from './AppStateContext';

export type { PlotPhoto, PlotTitlePhoto } from './persistence.types';
import type { PlotPhoto, PlotTitlePhoto } from './persistence.types';

const STORAGE_KEY = 'tracebud-offline-web-v1';

type WebStore = {
  farmer?: FarmerProfile;
  plots: Plot[];
  plotPhotos: PlotPhoto[];
  plotLegal: Record<string, string>;
  plotTitlePhotos: PlotTitlePhoto[];
  nextPhotoId: number;
  nextTitlePhotoId: number;
};

function emptyStore(): WebStore {
  return {
    plots: [],
    plotPhotos: [],
    plotLegal: {},
    plotTitlePhotos: [],
    nextPhotoId: 1,
    nextTitlePhotoId: 1,
  };
}

function readStore(): WebStore {
  if (typeof window === 'undefined') {
    return emptyStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as WebStore;
    return {
      ...emptyStore(),
      ...parsed,
      plots: Array.isArray(parsed.plots) ? parsed.plots : [],
      plotPhotos: Array.isArray(parsed.plotPhotos) ? parsed.plotPhotos : [],
      plotLegal: parsed.plotLegal && typeof parsed.plotLegal === 'object' ? parsed.plotLegal : {},
      plotTitlePhotos: Array.isArray(parsed.plotTitlePhotos) ? parsed.plotTitlePhotos : [],
      nextPhotoId: typeof parsed.nextPhotoId === 'number' ? parsed.nextPhotoId : 1,
      nextTitlePhotoId: typeof parsed.nextTitlePhotoId === 'number' ? parsed.nextTitlePhotoId : 1,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: WebStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function initDatabase() {
  readStore();
}

export function loadAppState(): Promise<{
  farmer?: FarmerProfile;
  plots: Plot[];
}> {
  const s = readStore();
  return Promise.resolve({
    farmer: s.farmer,
    plots: s.plots,
  });
}

export function persistFarmer(farmer?: FarmerProfile) {
  const s = readStore();
  s.farmer = farmer;
  writeStore(s);
}

export function persistPlots(plots: Plot[]) {
  const s = readStore();
  s.plots = plots;
  writeStore(s);
}

export function logAuditEvent(_params: {
  userId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  /* no-op on web demo */
}

export function persistPlotPhoto(photo: Omit<PlotPhoto, 'id'>) {
  const s = readStore();
  const id = s.nextPhotoId++;
  s.plotPhotos.push({
    id,
    plotId: photo.plotId,
    uri: photo.uri,
    takenAt: photo.takenAt,
    latitude: photo.latitude ?? null,
    longitude: photo.longitude ?? null,
  });
  writeStore(s);
}

export function loadPhotosForPlot(plotId: string): Promise<PlotPhoto[]> {
  const s = readStore();
  return Promise.resolve(
    s.plotPhotos.filter((p) => p.plotId === plotId).sort((a, b) => b.takenAt - a.takenAt),
  );
}

export function savePlotCadastralKey(plotId: string, cadastralKey: string | null) {
  const s = readStore();
  if (!cadastralKey) {
    delete s.plotLegal[plotId];
  } else {
    s.plotLegal[plotId] = cadastralKey;
  }
  writeStore(s);
}

export function loadPlotCadastralKey(plotId: string): Promise<string | null> {
  const s = readStore();
  return Promise.resolve(s.plotLegal[plotId] ?? null);
}

export function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>) {
  const s = readStore();
  const id = s.nextTitlePhotoId++;
  s.plotTitlePhotos.push({
    id,
    plotId: photo.plotId,
    uri: photo.uri,
    takenAt: photo.takenAt,
  });
  writeStore(s);
}

export function loadTitlePhotosForPlot(plotId: string): Promise<PlotTitlePhoto[]> {
  const s = readStore();
  return Promise.resolve(
    s.plotTitlePhotos.filter((p) => p.plotId === plotId).sort((a, b) => b.takenAt - a.takenAt),
  );
}
