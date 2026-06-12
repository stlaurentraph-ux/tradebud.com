import {
  DEMO_FARMER_ID,
  DEMO_PLOT_COLINA_ID,
  DEMO_PLOT_FINCA_ID,
  DEMO_PLOT_ROBLE_ID,
  DEMO_SERVER_PLOT_COLINA_ID,
  DEMO_SERVER_PLOT_FINCA_ID,
  DEMO_SERVER_PLOT_ROBLE_ID,
} from './storeScreenshotDemo.constants';

export function isStoreDemoFarmer(farmerId: string): boolean {
  return farmerId === DEMO_FARMER_ID;
}

/** Mock server plot rows — matched to local plots by name for checklist + harvest counts. */
export function getStoreDemoBackendPlots() {
  return [
    {
      id: DEMO_SERVER_PLOT_FINCA_ID,
      name: 'Finca Norte',
      area_ha: 10.88,
      kind: 'polygon',
      status: 'compliant',
      client_plot_id: DEMO_PLOT_FINCA_ID,
    },
    {
      id: DEMO_SERVER_PLOT_ROBLE_ID,
      name: 'El Roble',
      area_ha: 5.26,
      kind: 'polygon',
      status: 'compliant',
      client_plot_id: DEMO_PLOT_ROBLE_ID,
    },
    {
      id: DEMO_SERVER_PLOT_COLINA_ID,
      name: 'La Colina',
      area_ha: 1.12,
      kind: 'polygon',
      status: 'action_needed',
      client_plot_id: DEMO_PLOT_COLINA_ID,
    },
  ];
}

export function countStoreDemoHarvestVouchers(plotServerId: string): number {
  return getStoreDemoHarvestVouchers().filter(
    (v) => String(v.plot_id) === String(plotServerId),
  ).length;
}

/** Mock harvest vouchers — varied per plot for My Plots + Harvest tab screenshots. */
export function getStoreDemoHarvestVouchers() {
  return [
    {
      id: 'demo-voucher-finca-1',
      plot_id: DEMO_SERVER_PLOT_FINCA_ID,
      plot_name: 'Finca Norte',
      kg: 850,
      created_at: '2026-02-10T14:30:00.000Z',
      status: 'synced',
    },
    {
      id: 'demo-voucher-finca-2',
      plot_id: DEMO_SERVER_PLOT_FINCA_ID,
      plot_name: 'Finca Norte',
      kg: 320,
      created_at: '2026-02-02T09:15:00.000Z',
      status: 'synced',
    },
    {
      id: 'demo-voucher-finca-3',
      plot_id: DEMO_SERVER_PLOT_FINCA_ID,
      plot_name: 'Finca Norte',
      kg: 180,
      created_at: '2026-01-22T16:45:00.000Z',
      status: 'synced',
    },
    {
      id: 'demo-voucher-roble-1',
      plot_id: DEMO_SERVER_PLOT_ROBLE_ID,
      plot_name: 'El Roble',
      kg: 420,
      created_at: '2026-02-05T11:00:00.000Z',
      status: 'synced',
    },
  ];
}
