/**
 * Desk mapping workflow mirrors — geometry approval + cadastral lookup proxies.
 * Guard: dashboard-mapping-workflow-guard.mjs
 */
export const DASHBOARD_MAPPING_WORKFLOW_SURFACES = [
  {
    id: 'plot-detail-geometry-approval',
    pagePath: 'components/plots/plot-detail-page-content.tsx',
    cardComponent: 'PlotGeometryApprovalCard',
    approveApiRoute: 'app/api/plots/[id]/approve-geometry/route.ts',
    mapPreviewHook: 'usePlotMapPreview',
  },
  {
    id: 'cadastral-parcel-lookup-proxy',
    pagePath: 'app/api/cadastral/parcels/lookup/route.ts',
    backendPath: '/v1/cadastral/parcels/lookup',
  },
] as const;

export const DASHBOARD_MAPPING_WORKFLOW_TEST_IDS = [
  'plot-geometry-approval-card',
  'plot-geometry-approval-badge',
  'plot-geometry-approval-action',
] as const;

export const DASHBOARD_MAPPING_WORKFLOW_ANALYTICS_EVENTS = ['plot_geometry_approved'] as const;
