export const DEMO_FARMER_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_PLOT_FINCA_ID = 'a0000000-0000-4000-8000-000000000011';
export const DEMO_PLOT_ROBLE_ID = 'a0000000-0000-4000-8000-000000000012';
export const DEMO_PLOT_COLINA_ID = 'a0000000-0000-4000-8000-000000000013';

/** Server-side plot ids returned by demo API fixtures (harvest vouchers reference these). */
export const DEMO_SERVER_PLOT_FINCA_ID = 'b0000000-0000-4000-8000-000000000011';
export const DEMO_SERVER_PLOT_ROBLE_ID = 'b0000000-0000-4000-8000-000000000012';
export const DEMO_SERVER_PLOT_COLINA_ID = 'b0000000-0000-4000-8000-000000000013';

/** Google Maps field reference for store-demo walk screenshots (330 m zoom). */
export const DEMO_WALK_FIELD_CENTER = {
  latitude: 15.5667748,
  longitude: -87.1669435,
} as const;

export const DEMO_WALK_MAP_REGION = {
  latitude: DEMO_WALK_FIELD_CENTER.latitude,
  longitude: DEMO_WALK_FIELD_CENTER.longitude,
  latitudeDelta: 0.0032,
  longitudeDelta: 0.0032,
} as const;
