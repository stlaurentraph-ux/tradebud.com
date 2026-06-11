import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

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
  persistPlotPhoto,
  persistPlotTitlePhoto,
  persistPlots,
  setSetting,
} from '@/features/state/persistence';

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

async function copyBundledDemoPhoto(fileName: string): Promise<string> {
  const asset = Asset.fromModule(require('../../assets/images/tracebud-logo.png'));
  await asset.downloadAsync();
  const from = asset.localUri;
  if (!from) throw new Error('Demo asset missing');
  const fsAny = FileSystem as { documentDirectory?: string | null };
  const dest = `${fsAny.documentDirectory ?? ''}${fileName}`;
  await FileSystem.copyAsync({ from, to: dest });
  return dest;
}

async function clearPlotMediaAndQueue(db: Awaited<ReturnType<typeof import('expo-sqlite').openDatabaseAsync>>) {
  await db.execAsync(`
    DELETE FROM pending_sync;
    DELETE FROM plot_photos;
    DELETE FROM plot_title_photos;
    DELETE FROM plot_evidence;
  `);
}

export async function seedStoreScreenshotDemo(): Promise<{ farmer: FarmerProfile; plots: Plot[] }> {
  await initDatabase();
  const SQLite = await import('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('tracebud_offline.db');
  await clearPlotMediaAndQueue(db);

  await persistFarmer(DEMO_FARMER);
  await persistPlots(DEMO_PLOTS);

  await clearPersistedSyncAuth();
  await setSetting('language', 'en');

  const photoUri = await copyBundledDemoPhoto('demo-plot-photo-finca.jpg');
  const titleUri = await copyBundledDemoPhoto('demo-plot-title-finca.jpg');
  const takenAt = now;

  await persistPlotTitlePhoto({
    plotId: DEMO_PLOT_FINCA_ID,
    uri: titleUri,
    takenAt,
  });
  for (let i = 0; i < 3; i += 1) {
    await persistPlotPhoto({
      plotId: DEMO_PLOT_FINCA_ID,
      uri: photoUri,
      takenAt: takenAt + i * 1000,
      latitude: 14.082,
      longitude: -87.191,
    });
  }
  await persistPlotTitlePhoto({
    plotId: DEMO_PLOT_ROBLE_ID,
    uri: titleUri,
    takenAt: takenAt + 5000,
  });

  return { farmer: DEMO_FARMER, plots: DEMO_PLOTS };
}
