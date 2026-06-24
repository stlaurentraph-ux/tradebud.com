/**
 * Exporter critical-path workflow mirrors — lineage, readiness gates, north-star CTAs.
 * Guard: dashboard-exporter-workflow-guard.mjs
 * Manual QA: product-os/04-quality/exporter-critical-path-qa.md
 */
export const DASHBOARD_EXPORTER_CRITICAL_ROUTES = [
  '/',
  '/farmers/new',
  '/harvests',
  '/packages',
  '/packages/[id]',
  '/packages/[id]/assemble',
  '/compliance/issues',
] as const;

/** Package detail surfaces gated on readiness blockers (exporter-critical-path-qa §2). */
export const DASHBOARD_EXPORTER_READINESS_GATE_SURFACES = [
  {
    id: 'package-detail-assemble',
    pagePath: 'app/packages/[id]/page.tsx',
    readinessHook: 'usePackageReadiness',
    blockerComponent: 'BlockerCard',
    lineageComponent: 'PackageLineageSummaryCard',
    assembleAction: 'getAssembleShipmentActionLabel',
  },
  {
    id: 'package-assemble-seal',
    pagePath: 'app/packages/[id]/assemble/page.tsx',
    readinessHook: 'usePackageReadiness',
    sealGate: 'readinessBlockers.length === 0',
  },
] as const;

/** Exporter north-star KPI CTA targets (dashboard-north-star.ts). */
export const DASHBOARD_EXPORTER_NORTH_STAR_CTAS = [
  { condition: 'blocking_issues_count > 0', ctaHref: '/compliance/issues' },
  { condition: 'yield_failures_count > 0', ctaHref: '/compliance/issues' },
  { condition: 'ready_to_seal > 0', ctaHref: '/packages?status=READY' },
  { condition: 'default_handoff', ctaHref: '/packages?status=SEALED' },
] as const;

/** Handoff copy helpers — exporter must not see TRACES filing language (§4). */
export const DASHBOARD_EXPORTER_HANDOFF_COPY_HELPERS = [
  'getPackageFilingWorkflowHint',
  'getPackagePreflightBlockersTitle',
  'getAssembleShipmentSubtitle',
  'getPackageAssembleSealSuccessToast',
] as const;

/** Analytics events for exporter critical path. */
export const DASHBOARD_EXPORTER_ANALYTICS_EVENTS = [
  'dashboard_exporter_lineage_step_clicked',
  'dashboard_package_seal_success',
  'dashboard_package_seal_failure',
  'dashboard_upstream_blocker_alert_clicked',
] as const;

export const DASHBOARD_EXPORTER_VIRGIN_PANEL_ENTRY = {
  pagePath: 'components/dashboards/virgin-state-panel.tsx',
  maturityHelper: 'isVirginWorkspace',
  primaryCtaRoutes: ['/contacts/add?mode=csv', '/farmers/new'],
} as const;
