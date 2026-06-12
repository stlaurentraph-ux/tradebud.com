export const DEMO_FARMER_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_PLOT_FINCA_ID = 'a0000000-0000-4000-8000-000000000011';
export const DEMO_PLOT_ROBLE_ID = 'a0000000-0000-4000-8000-000000000012';
export const DEMO_PLOT_COLINA_ID = 'a0000000-0000-4000-8000-000000000013';

/** Server-side plot ids returned by demo API fixtures (harvest vouchers reference these). */
export const DEMO_SERVER_PLOT_FINCA_ID = 'b0000000-0000-4000-8000-000000000011';
export const DEMO_SERVER_PLOT_ROBLE_ID = 'b0000000-0000-4000-8000-000000000012';
export const DEMO_SERVER_PLOT_COLINA_ID = 'b0000000-0000-4000-8000-000000000013';

/** Almost-closed field boundary for walk-perimeter store screenshots (Finca Norte area). */
export const DEMO_WALK_PREVIEW_RING = [
  { latitude: 14.072, longitude: -87.212 },
  { latitude: 14.092, longitude: -87.188 },
  { latitude: 14.078, longitude: -87.168 },
  { latitude: 14.058, longitude: -87.198 },
  { latitude: 14.065, longitude: -87.208 },
] as const;

export const DEMO_WALK_MAP_REGION = {
  latitude: 14.075,
  longitude: -87.192,
  latitudeDelta: 0.028,
  longitudeDelta: 0.028,
} as const;
