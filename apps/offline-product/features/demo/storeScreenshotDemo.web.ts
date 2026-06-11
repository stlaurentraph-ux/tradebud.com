import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { persistFarmer, persistPlots } from '@/features/state/persistence';

import {
  DEMO_FARMER_ID,
  DEMO_PLOT_FINCA_ID,
} from './storeScreenshotDemo.constants';

const DEMO_FARMER: FarmerProfile = {
  id: DEMO_FARMER_ID,
  name: 'Maria Santos',
  role: 'farmer',
  selfDeclared: true,
  commodityCode: 'coffee',
};

export async function seedStoreScreenshotDemo(): Promise<{ farmer: FarmerProfile; plots: Plot[] }> {
  const plots: Plot[] = [
    {
      id: DEMO_PLOT_FINCA_ID,
      farmerId: DEMO_FARMER_ID,
      name: 'Finca Norte',
      createdAt: Date.now(),
      areaSquareMeters: 4200,
      areaHectares: 10.88,
      kind: 'polygon',
      points: [],
    },
  ];
  await persistFarmer(DEMO_FARMER);
  await persistPlots(plots);
  return { farmer: DEMO_FARMER, plots };
}
