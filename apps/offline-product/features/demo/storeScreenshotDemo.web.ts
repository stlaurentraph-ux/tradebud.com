import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { persistFarmer, persistPlots } from '@/features/state/persistence';

import {
  DEMO_FARMER_ID,
  DEMO_PLOT_COLINA_ID,
  DEMO_PLOT_FINCA_ID,
  DEMO_PLOT_ROBLE_ID,
} from './storeScreenshotDemo.constants';

const now = Date.UTC(2026, 2, 15, 10, 0, 0);

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
};

const DEMO_PLOTS: Plot[] = [
  {
    id: DEMO_PLOT_FINCA_ID,
    farmerId: DEMO_FARMER_ID,
    name: 'Finca Norte',
    createdAt: now,
    areaSquareMeters: 108_800,
    areaHectares: 10.88,
    kind: 'polygon',
    points: [],
    declaredAreaHectares: 10.88,
  },
  {
    id: DEMO_PLOT_ROBLE_ID,
    farmerId: DEMO_FARMER_ID,
    name: 'El Roble',
    createdAt: now - 172_800_000,
    areaSquareMeters: 52_600,
    areaHectares: 5.26,
    kind: 'polygon',
    points: [],
    declaredAreaHectares: 5.26,
  },
  {
    id: DEMO_PLOT_COLINA_ID,
    farmerId: DEMO_FARMER_ID,
    name: 'La Colina',
    createdAt: now - 86_400_000,
    areaSquareMeters: 11_200,
    areaHectares: 1.12,
    kind: 'polygon',
    points: [],
    declaredAreaHectares: 1.12,
  },
];

export async function seedStoreScreenshotDemo(): Promise<{ farmer: FarmerProfile; plots: Plot[] }> {
  await persistFarmer(DEMO_FARMER);
  await persistPlots(DEMO_PLOTS);
  return { farmer: DEMO_FARMER, plots: DEMO_PLOTS };
}
