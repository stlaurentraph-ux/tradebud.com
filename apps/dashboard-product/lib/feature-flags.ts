/**
 * RELEASE 2+ FEATURE FENCE
 *
 * This module defines all features that are explicitly deferred to Release 2 or later.
 * Features listed here MUST NOT be built or exposed in the MVP (Release 1).
 *
 * Reference: TRACEBUD_V1_2_EUDR_SPEC Section 51 (MVP Scope Definition)
 */

// ============================================================
// FEATURE FLAG DEFINITIONS
// ============================================================

export type FeatureFlag =
  // MVP Features (Release 1) - ENABLED
  | 'mvp_manual_assist_dds'
  | 'mvp_operator_workflow'
  | 'mvp_compliance_issues'
  | 'mvp_role_decisions'
  | 'mvp_request_campaigns'
  | 'mvp_yield_checks'
  | 'mvp_evidence_upload'
  | 'mvp_fpic_management'
  | 'mvp_basic_reporting'
  | 'mvp_audit_log'
  // Release 2+ Features - DISABLED
  | 'r2_api_direct_submission'
  | 'r2_simplified_declarations'
  | 'r2_downstream_operator_workflow'
  | 'r2_trader_workflow'
  | 'r2_sponsor_governance'
  | 'r2_network_management'
  | 'r2_delegated_admin'
  | 'r2_data_visibility_policies'
  | 'r2_producer_wallet'
  | 'r2_offline_field_capture'
  | 'r2_traces_drift_monitor'
  | 'r2_advanced_reporting'
  | 'r2_bulk_operations'
  | 'r2_multi_language'
  | 'r2_mobile_app'
  | 'r2_sso_integration'
  | 'r2_webhook_notifications';

// Feature flag configuration
interface FeatureConfig {
  enabled: boolean;
  release: 'mvp' | 'r2' | 'r3' | 'future';
  description: string;
  dependsOn?: FeatureFlag[];
  gatedRoutes?: string[];
  gatedComponents?: string[];
}

const FEATURE_CONFIG: Record<FeatureFlag, FeatureConfig> = {
  // ============================================================
  // MVP FEATURES (Release 1) - ENABLED
  // ============================================================

  mvp_manual_assist_dds: {
    enabled: true,
    release: 'mvp',
    description: 'Manual-assist DDS submission workflow via TRACES',
    gatedRoutes: ['/packages', '/packages/[id]'],
  },

  mvp_operator_workflow: {
    enabled: true,
    release: 'mvp',
    description: 'OPERATOR legal role workflow (first placement on EU market)',
    gatedRoutes: ['/packages', '/role-decisions'],
  },

  mvp_compliance_issues: {
    enabled: true,
    release: 'mvp',
    description: 'Compliance issue triage and resolution',
    gatedRoutes: ['/compliance'],
  },

  mvp_role_decisions: {
    enabled: true,
    release: 'mvp',
    description: 'Legal role decision engine and manual classification',
    gatedRoutes: ['/role-decisions'],
  },

  mvp_request_campaigns: {
    enabled: true,
    release: 'mvp',
    description: 'Cross-org evidence request campaigns',
    gatedRoutes: ['/requests'],
  },

  mvp_yield_checks: {
    enabled: true,
    release: 'mvp',
    description: 'Yield-cap anti-laundering checks',
    gatedRoutes: ['/harvests'],
  },

  mvp_evidence_upload: {
    enabled: true,
    release: 'mvp',
    description: 'Evidence document upload with provenance chain',
    gatedRoutes: ['/fpic'],
  },

  mvp_fpic_management: {
    enabled: true,
    release: 'mvp',
    description: 'FPIC document management and tracking',
    gatedRoutes: ['/fpic'],
  },

  mvp_basic_reporting: {
    enabled: true,
    release: 'mvp',
    description: 'Basic compliance and submission reports',
    gatedRoutes: ['/reports'],
  },

  mvp_audit_log: {
    enabled: true,
    release: 'mvp',
    description: 'Audit event log viewing',
    gatedRoutes: ['/audit-log'],
  },

  // ============================================================
  // RELEASE 2+ FEATURES - DISABLED
  // Per Section 51 MVP Scope, these are explicitly deferred
  // ============================================================

  r2_api_direct_submission: {
    enabled: false,
    release: 'r2',
    description: 'API-direct DDS submission (bypassing manual TRACES entry)',
    gatedRoutes: ['/packages/[id]/api-submit'],
    gatedComponents: ['APISubmissionForm', 'DirectSubmitButton'],
  },

  r2_simplified_declarations: {
    enabled: false,
    release: 'r2',
    description: 'Simplified declaration workflow for micro/small operators',
    dependsOn: ['mvp_role_decisions'],
    gatedRoutes: ['/simplified-declarations'],
    gatedComponents: ['SimplifiedDeclarationForm', 'SimplifiedPathBadge'],
  },

  r2_downstream_operator_workflow: {
    enabled: false,
    release: 'r2',
    description: 'Downstream operator (first/subsequent) reference retention workflow',
    gatedRoutes: ['/downstream'],
    gatedComponents: ['DownstreamReferenceForm', 'ReferenceRetentionPanel'],
  },

  r2_trader_workflow: {
    enabled: false,
    release: 'r2',
    description: 'Trader retention workflow',
    gatedRoutes: ['/trader'],
    gatedComponents: ['TraderRetentionForm'],
  },

  r2_sponsor_governance: {
    enabled: false,
    release: 'r2',
    description: 'Network sponsor governance and administration',
    gatedRoutes: ['/sponsor-admin', '/sponsor-admin/*'],
    gatedComponents: ['SponsorDashboard', 'NetworkHealthCard', 'SponsorPolicyEditor'],
  },

  r2_network_management: {
    enabled: false,
    release: 'r2',
    description: 'Sponsor network member management',
    dependsOn: ['r2_sponsor_governance'],
    gatedRoutes: ['/sponsor-admin/network'],
    gatedComponents: ['NetworkMemberList', 'InviteMemberDialog'],
  },

  r2_delegated_admin: {
    enabled: false,
    release: 'r2',
    description: 'Delegated admin actions for sponsors',
    dependsOn: ['r2_sponsor_governance'],
    gatedRoutes: ['/sponsor-admin/delegated'],
    gatedComponents: ['DelegatedAdminPanel'],
  },

  r2_data_visibility_policies: {
    enabled: false,
    release: 'r2',
    description: 'Sponsor data visibility policy configuration',
    dependsOn: ['r2_sponsor_governance'],
    gatedRoutes: ['/sponsor-admin/policies'],
    gatedComponents: ['DataVisibilityPolicyEditor'],
  },

  r2_producer_wallet: {
    enabled: false,
    release: 'r2',
    description: 'Producer data wallet and portability',
    gatedRoutes: ['/wallet'],
    gatedComponents: ['ProducerWallet', 'DataExportPanel'],
  },

  r2_offline_field_capture: {
    enabled: false,
    release: 'r2',
    description: 'Offline-capable field data capture',
    gatedComponents: ['OfflineCapture', 'SyncIndicator'],
  },

  r2_traces_drift_monitor: {
    enabled: false,
    release: 'r2',
    description: 'TRACES schema drift monitoring (internal compliance ops)',
    gatedRoutes: ['/admin/traces-monitor'],
    gatedComponents: ['TracesDriftMonitor', 'SchemaComparisonPanel'],
  },

  r2_advanced_reporting: {
    enabled: false,
    release: 'r2',
    description: 'Advanced analytics and custom report builder',
    gatedRoutes: ['/reports/builder'],
    gatedComponents: ['ReportBuilder', 'CustomReportDialog'],
  },

  r2_bulk_operations: {
    enabled: false,
    release: 'r2',
    description: 'Bulk edit and batch operations',
    gatedComponents: ['BulkEditPanel', 'BatchActionBar'],
  },

  r2_multi_language: {
    enabled: false,
    release: 'r3',
    description: 'Multi-language support',
    gatedComponents: ['LanguageSwitcher'],
  },

  r2_mobile_app: {
    enabled: false,
    release: 'r3',
    description: 'Native mobile application',
  },

  r2_sso_integration: {
    enabled: false,
    release: 'r2',
    description: 'Enterprise SSO integration (SAML/OIDC)',
    gatedRoutes: ['/admin/sso'],
    gatedComponents: ['SSOConfigPanel'],
  },

  r2_webhook_notifications: {
    enabled: false,
    release: 'r2',
    description: 'Webhook-based event notifications',
    gatedRoutes: ['/admin/webhooks'],
    gatedComponents: ['WebhookConfigPanel'],
  },
};

// ============================================================
// FEATURE FLAG UTILITIES
// ============================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = FEATURE_CONFIG[flag];
  if (!config) return false;

  // Check dependencies
  if (config.dependsOn) {
    const allDepsEnabled = config.dependsOn.every((dep) => isFeatureEnabled(dep));
    if (!allDepsEnabled) return false;
  }

  return config.enabled;
}

/**
 * Check if a route is gated by a disabled feature
 */
export function isRouteGated(route: string): boolean {
  for (const [flag, config] of Object.entries(FEATURE_CONFIG)) {
    if (!config.enabled && config.gatedRoutes) {
      for (const gatedRoute of config.gatedRoutes) {
        // Handle dynamic routes like /packages/[id]
        const pattern = gatedRoute.replace(/\[.*?\]/g, '[^/]+').replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(route)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if a component is gated by a disabled feature
 */
export function isComponentGated(componentName: string): boolean {
  for (const [flag, config] of Object.entries(FEATURE_CONFIG)) {
    if (!config.enabled && config.gatedComponents?.includes(componentName)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_CONFIG)
    .filter(([_, config]) => !config.enabled)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Get all MVP features
 */
export function getMVPFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_CONFIG)
    .filter(([_, config]) => config.release === 'mvp')
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Get feature description
 */
export function getFeatureDescription(flag: FeatureFlag): string {
  return FEATURE_CONFIG[flag]?.description || '';
}

/**
 * Get feature release version
 */
export function getFeatureRelease(flag: FeatureFlag): string {
  return FEATURE_CONFIG[flag]?.release || 'unknown';
}

// ============================================================
// REACT COMPONENTS
// ============================================================

/**
 * Feature gate HOC - wraps a component and only renders if feature is enabled
 */
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  flag: FeatureFlag,
  fallback?: React.ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    if (!isFeatureEnabled(flag)) {
      return fallback || null;
    }
    return <Component {...props} />;
  };
}

// ============================================================
// DEFERRED FEATURES DOCUMENTATION
// ============================================================

export const RELEASE_2_DEFERRED_FEATURES = {
  submission: [
    'API_DIRECT submission mode (TRACES API integration)',
    'Simplified declaration workflow for micro/small operators',
    'TRACES schema drift monitoring',
  ],
  workflows: [
    'Downstream operator (first) reference retention workflow',
    'Downstream operator (subsequent) workflow',
    'Trader retention workflow',
  ],
  governance: [
    'Sponsor governance dashboard',
    'Network member management',
    'Delegated admin actions',
    'Data visibility policy configuration',
  ],
  producer: [
    'Producer data wallet',
    'Offline field capture',
    'GDPR data export/portability',
  ],
  operations: [
    'Advanced reporting and custom report builder',
    'Bulk edit and batch operations',
    'Webhook-based notifications',
    'Enterprise SSO integration',
  ],
  platform: [
    'Multi-language support',
    'Native mobile application',
  ],
} as const;

/**
 * Reasons for deferral per Section 51 MVP Scope
 */
export const DEFERRAL_RATIONALE = {
  r2_api_direct_submission:
    'Requires TRACES API access and production credentials. MVP uses MANUAL_ASSIST mode.',
  r2_simplified_declarations:
    'Requires validated simplified-path eligibility rules. Deferred to avoid misclassification risk.',
  r2_downstream_operator_workflow:
    'Downstream operator workflows require upstream DDS validation infrastructure.',
  r2_trader_workflow:
    'Trader retention workflow is lowest priority per user research.',
  r2_sponsor_governance:
    'Sponsor governance requires multi-tenant isolation patterns not yet finalized.',
  r2_producer_wallet:
    'Producer wallet requires mobile-first design and offline sync infrastructure.',
} as const;
