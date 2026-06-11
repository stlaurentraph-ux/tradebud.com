import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import {
  DEMO_FARMER_ID,
  DEMO_PLOT_COLINA_ID,
  DEMO_PLOT_FINCA_ID,
  DEMO_PLOT_ROBLE_ID,
} from './storeScreenshotDemo.constants';
import { clearPersistedSyncAuth } from '@/features/api/syncAuthSession';
import {
  initDatabase,
  persistFarmer,
  persistPlotEvidenceItem,
  persistPlotPhoto,
  persistPlotTitlePhoto,
  persistPlots,
  savePlotCadastralKey,
  savePlotTenure,
  setSetting,
} from '@/features/state/persistence';

const LANG_STORAGE_KEY = 'tracebudAppLanguage';
const now = Date.UTC(2026, 2, 15, 10, 0, 0);

function polygon(
  id: string,
  name: string,
  areaHectares: number,
  ring: { latitude: number; longitude: number }[],
): Plot {
  const areaSquareMeters = areaHectares * 10_000;
  return {
    id,
    farmerId: DEMO_FARMER_ID,
    name,
    createdAt:
      now -
      (id === DEMO_PLOT_COLINA_ID ? 86_400_000 : id === DEMO_PLOT_ROBLE_ID ? 172_800_000 : 0),
    areaSquareMeters,
    areaHectares,
    kind: 'polygon',
    points: ring,
    declaredAreaHectares: areaHectares,
    precisionMetersAtSave: 4.2,
  };
}

const DEMO_PLOTS: Plot[] = [
  polygon(DEMO_PLOT_FINCA_ID, 'Finca Norte', 10.88, [
    { latitude: 14.072, longitude: -87.212 },
    { latitude: 14.092, longitude: -87.188 },
    { latitude: 14.078, longitude: -87.168 },
    { latitude: 14.058, longitude: -87.198 },
  ]),
  polygon(DEMO_PLOT_ROBLE_ID, 'El Roble', 5.26, [
    { latitude: 14.064, longitude: -87.228 },
    { latitude: 14.078, longitude: -87.208 },
    { latitude: 14.068, longitude: -87.192 },
    { latitude: 14.052, longitude: -87.214 },
  ]),
  polygon(DEMO_PLOT_COLINA_ID, 'La Colina', 1.12, [
    { latitude: 14.0888, longitude: -87.1855 },
    { latitude: 14.0912, longitude: -87.1821 },
    { latitude: 14.0895, longitude: -87.1792 },
    { latitude: 14.0869, longitude: -87.1834 },
  ]),
];

const DEMO_FARMER: FarmerProfile = {
  id: DEMO_FARMER_ID,
  name: 'Maria Santos',
  role: 'farmer',
  selfDeclared: true,
  selfDeclaredAt: now,
  fpicConsent: true,
  laborNoChildLabor: true,
  laborNoForcedLabor: true,
  postalAddress: 'Col. Palmira, Tegucigalpa, Honduras',
  commodityCode: 'coffee',
  declarationLatitude: 14.0818,
  declarationLongitude: -87.2068,
  declarationGeoCapturedAt: now,
};

async function copyBundledDemoAsset(fileName: string): Promise<string> {
  const asset = Asset.fromModule(require('../../assets/images/tracebud-logo.png'));
  await asset.downloadAsync();
  const from = asset.localUri;
  if (!from) throw new Error('Demo asset missing');
  const fsAny = FileSystem as { documentDirectory?: string | null };
  const dest = `${fsAny.documentDirectory ?? ''}${fileName}`;
  await FileSystem.copyAsync({ from, to: dest });
  return dest;
}

async function clearDemoTables(db: Awaited<ReturnType<typeof import('expo-sqlite').openDatabaseAsync>>) {
  await db.execAsync(`
    DELETE FROM pending_sync;
    DELETE FROM plot_photos;
    DELETE FROM plot_title_photos;
    DELETE FROM plot_evidence;
    DELETE FROM plot_legal;
  `);
}

async function seedGroundPhotos(params: {
  plotId: string;
  count: number;
  uri: string;
  takenAt: number;
  lat: number;
  lon: number;
}) {
  for (let i = 0; i < params.count; i += 1) {
    await persistPlotPhoto({
      plotId: params.plotId,
      uri: params.uri,
      takenAt: params.takenAt + i * 1000,
      latitude: params.lat + i * 0.0001,
      longitude: params.lon + i * 0.0001,
    });
  }
}

async function seedPlotMediaAndDocs(demoUri: string) {
  const profilePlotId = `profile:${DEMO_FARMER_ID}`;

  await persistPlotTitlePhoto({
    plotId: DEMO_PLOT_FINCA_ID,
    uri: demoUri,
    takenAt: now,
  });
  await seedGroundPhotos({
    plotId: DEMO_PLOT_FINCA_ID,
    count: 6,
    uri: demoUri,
    takenAt: now,
    lat: 14.082,
    lon: -87.191,
  });
  await persistPlotEvidenceItem({
    plotId: DEMO_PLOT_FINCA_ID,
    kind: 'tenure_evidence',
    uri: demoUri,
    mimeType: 'application/pdf',
    label: 'Land title — Finca Norte.pdf',
    takenAt: now - 3_600_000,
  });
  await savePlotCadastralKey(DEMO_PLOT_FINCA_ID, 'HND-CAT-48291');
  await savePlotTenure(DEMO_PLOT_FINCA_ID, false, null);

  await persistPlotTitlePhoto({
    plotId: DEMO_PLOT_ROBLE_ID,
    uri: demoUri,
    takenAt: now + 5000,
  });
  await seedGroundPhotos({
    plotId: DEMO_PLOT_ROBLE_ID,
    count: 4,
    uri: demoUri,
    takenAt: now + 10_000,
    lat: 14.068,
    lon: -87.205,
  });
  await persistPlotEvidenceItem({
    plotId: DEMO_PLOT_ROBLE_ID,
    kind: 'protected_area_permit',
    uri: demoUri,
    mimeType: 'application/pdf',
    label: 'SINAPH buffer permit — El Roble.pdf',
    takenAt: now - 7_200_000,
  });
  await savePlotCadastralKey(DEMO_PLOT_ROBLE_ID, 'HND-CAT-51004');
  await savePlotTenure(DEMO_PLOT_ROBLE_ID, false, null);

  await seedGroundPhotos({
    plotId: DEMO_PLOT_COLINA_ID,
    count: 2,
    uri: demoUri,
    takenAt: now + 20_000,
    lat: 14.089,
    lon: -87.184,
  });
  await savePlotCadastralKey(DEMO_PLOT_COLINA_ID, '');
  await savePlotTenure(DEMO_PLOT_COLINA_ID, true, 'Family possession — paperwork pending');

  await persistPlotEvidenceItem({
    plotId: profilePlotId,
    kind: 'fpic_repository',
    uri: demoUri,
    mimeType: 'application/pdf',
    label: 'Community consent minutes.pdf',
    takenAt: now - 86_400_000,
  });
  await persistPlotEvidenceItem({
    plotId: profilePlotId,
    kind: 'tenure_evidence',
    uri: demoUri,
    mimeType: 'application/pdf',
    label: 'National ID + cooperative letter.pdf',
    takenAt: now - 172_800_000,
  });
  await persistPlotEvidenceItem({
    plotId: profilePlotId,
    kind: 'protected_area_permit',
    uri: demoUri,
    mimeType: 'application/pdf',
    label: 'Municipal land-use clearance.pdf',
    takenAt: now - 259_200_000,
  });
  await persistPlotEvidenceItem({
    plotId: profilePlotId,
    kind: 'labor_evidence',
    uri: demoUri,
    mimeType: 'image/jpeg',
    label: 'Harvest crew conditions photo.jpg',
    takenAt: now - 345_600_000,
  });
}

export async function seedStoreScreenshotDemo(): Promise<{ farmer: FarmerProfile; plots: Plot[] }> {
  await initDatabase();
  const SQLite = await import('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('tracebud_offline.db');
  await clearDemoTables(db);

  await persistFarmer(DEMO_FARMER);
  await persistPlots(DEMO_PLOTS);

  await clearPersistedSyncAuth();
  await setSetting(LANG_STORAGE_KEY, 'en');

  try {
    const demoUri = await copyBundledDemoAsset('demo-store-asset.jpg');
    await seedPlotMediaAndDocs(demoUri);
  } catch {
    // Plots + mock API fixtures still power screenshots if photo copy fails.
  }

  return { farmer: DEMO_FARMER, plots: DEMO_PLOTS };
}
