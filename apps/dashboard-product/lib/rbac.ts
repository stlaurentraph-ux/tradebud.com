import type {
  TenantRole,
  User,
  LegalWorkflowRole,
  CommercialTier,
  WorkflowType,
  ShipmentStatus,
} from '@/types';
import { isRouteEnabled } from '@/lib/feature-gates';

// ============================================================
// CANONICAL PERMISSION SYSTEM
// Separates: Commercial Tier Permissions vs Legal Workflow Permissions
// ============================================================

// Commercial tier permissions (what features/UI a user can access)
export type CommercialPermission =
  // Package/Shipment permissions
  | 'packages:view'
  | 'packages:create'
  | 'packages:edit'
  | 'packages:delete'
  | 'packages:seal_shipment'
  | 'packages:submit_traces'
  | 'packages:approve'
  // Plot permissions
  | 'plots:view'
  | 'plots:create'
  | 'plots:edit'
  | 'plots:delete'
  | 'plots:bulk_upload'
  // Farmer permissions
  | 'farmers:view'
  | 'farmers:create'
  | 'farmers:edit'
  | 'farmers:delete'
  | 'farmers:link_validation'
  // Compliance permissions
  | 'compliance:view'
  | 'compliance:run_check'
  | 'compliance:approve'
  | 'compliance:create_issue'
  | 'compliance:resolve_issue'
  // Request campaign permissions
  | 'requests:view'
  | 'requests:create'
  | 'requests:send'
  | 'requests:respond'
  // Contacts CRM permissions
  | 'contacts:view'
  | 'contacts:create'
  | 'contacts:edit'
  // Report permissions
  | 'reports:view'
  | 'reports:generate'
  | 'reports:export'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  // Admin permissions
  | 'admin:view'
  | 'admin:manage_users'
  | 'admin:manage_roles'
  // Harvests/Batches permissions
  | 'harvests:view'
  | 'harvests:create'
  | 'harvests:edit'
  | 'harvests:request_exception'
  | 'harvests:approve_exception'
  // FPIC/Evidence permissions
  | 'fpic:view'
  | 'fpic:upload'
  | 'evidence:view'
  | 'evidence:upload'
  | 'evidence:review'
  // Audit log permissions
  | 'audit:view'
  | 'audit:export'
  // Role decision permissions
  | 'roles:view_decisions'
  | 'roles:manual_classify';

// Legacy Permission type alias for backwards compatibility
export type Permission = CommercialPermission;

// Legal workflow permissions (what legal actions a user can take per workflow)
export type LegalWorkflowPermission =
  | 'legal:submit_dds'
  | 'legal:submit_simplified_declaration'
  | 'legal:retain_reference'
  | 'legal:downstream_reference'
  | 'legal:trader_retention'
  | 'legal:acknowledge_liability';

// ============================================================
// COMMERCIAL TIER PERMISSION MATRIX
// Maps commercial tiers to available permissions
// ============================================================

const TIER_PERMISSION_MATRIX: Record<CommercialTier, CommercialPermission[]> = {
  tier_1: [
    // Farmers & Micro-Producers - minimal permissions
    'plots:view',
    'plots:create',
    'plots:edit',
    'farmers:view',
    'fpic:view',
    'fpic:upload',
    'evidence:view',
    'evidence:upload',
    'requests:view',
    'requests:respond',
    'contacts:view',
    'settings:view',
  ],
  tier_2: [
    // Exporters, Collectors & Cooperatives - full aggregation permissions
    'packages:view',
    'packages:create',
    'packages:edit',
    'packages:delete',
    'packages:seal_shipment',
    'packages:submit_traces',
    'plots:view',
    'plots:create',
    'plots:edit',
    'plots:delete',
    'plots:bulk_upload',
    'farmers:view',
    'farmers:create',
    'farmers:edit',
    'farmers:delete',
    'farmers:link_validation',
    'compliance:view',
    'compliance:run_check',
    'compliance:create_issue',
    'compliance:resolve_issue',
    'requests:view',
    'requests:create',
    'requests:send',
    'contacts:view',
    'contacts:create',
    'contacts:edit',
    'harvests:view',
    'harvests:create',
    'harvests:edit',
    'harvests:request_exception',
    'fpic:view',
    'fpic:upload',
    'evidence:view',
    'evidence:upload',
    'reports:view',
    'reports:generate',
    'reports:export',
    'audit:view',
    'audit:export',
    'roles:view_decisions',
    'settings:view',
    'settings:edit',
    'admin:view',
    'admin:manage_users',
    'admin:manage_roles',
  ],
  tier_3: [
    // EU Importers, Roasters & Brands - downstream workflow permissions
    'packages:view',
    'packages:approve',
    'plots:view',
    'farmers:view',
    'compliance:view',
    'compliance:approve',
    'requests:view',
    'requests:create',
    'requests:send',
    'requests:respond',
    'contacts:view',
    'contacts:create',
    'contacts:edit',
    'harvests:view',
    'harvests:approve_exception',
    'evidence:view',
    'evidence:review',
    'reports:view',
    'reports:generate',
    'reports:export',
    'audit:view',
    'audit:export',
    'roles:view_decisions',
    'roles:manual_classify',
    'settings:view',
    'settings:edit',
  ],
  tier_4: [
    // Network Sponsors - governance + all permissions
    'packages:view',
    'packages:create',
    'packages:edit',
    'packages:delete',
    'packages:seal_shipment',
    'packages:submit_traces',
    'packages:approve',
    'plots:view',
    'plots:create',
    'plots:edit',
    'plots:delete',
    'plots:bulk_upload',
    'farmers:view',
    'farmers:create',
    'farmers:edit',
    'farmers:delete',
    'farmers:link_validation',
    'compliance:view',
    'compliance:run_check',
    'compliance:approve',
    'compliance:create_issue',
    'compliance:resolve_issue',
    'requests:view',
    'requests:create',
    'requests:send',
    'requests:respond',
    'contacts:view',
    'contacts:create',
    'contacts:edit',
    'harvests:view',
    'harvests:create',
    'harvests:edit',
    'harvests:request_exception',
    'harvests:approve_exception',
    'fpic:view',
    'fpic:upload',
    'evidence:view',
    'evidence:upload',
    'evidence:review',
    'reports:view',
    'reports:generate',
    'reports:export',
    'audit:view',
    'audit:export',
    'roles:view_decisions',
    'roles:manual_classify',
    'settings:view',
    'settings:edit',
    'admin:view',
    'admin:manage_users',
    'admin:manage_roles',
  ],
};

// ============================================================
// LEGAL WORKFLOW ROLE PERMISSION MATRIX
// Maps legal roles to legal workflow permissions
// ============================================================

const LEGAL_ROLE_PERMISSION_MATRIX: Record<LegalWorkflowRole, LegalWorkflowPermission[]> = {
  OUT_OF_SCOPE: [],
  OPERATOR: [
    'legal:submit_dds',
    'legal:acknowledge_liability',
  ],
  MICRO_SMALL_PRIMARY_OPERATOR: [
    'legal:submit_simplified_declaration',
    'legal:acknowledge_liability',
  ],
  DOWNSTREAM_OPERATOR_FIRST: [
    'legal:downstream_reference',
    'legal:retain_reference',
    'legal:acknowledge_liability',
  ],
  DOWNSTREAM_OPERATOR_SUBSEQUENT: [
    'legal:downstream_reference',
    'legal:acknowledge_liability',
  ],
  TRADER: [
    'legal:trader_retention',
    'legal:acknowledge_liability',
  ],
  PENDING_MANUAL_CLASSIFICATION: [],
};

const PERMISSION_MATRIX: Record<TenantRole, CommercialPermission[]> = {
  exporter: TIER_PERMISSION_MATRIX['tier_2'],
  importer: TIER_PERMISSION_MATRIX['tier_3'],
  cooperative: [
    ...TIER_PERMISSION_MATRIX['tier_2'].filter(p =>
      !p.startsWith('packages:') || p === 'packages:view'
    ),
  ],
  country_reviewer: [
    ...TIER_PERMISSION_MATRIX['tier_3'],
    'roles:manual_classify',
  ],
};

// ============================================================
// NAVIGATION CONFIGURATION
// ============================================================

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permission: CommercialPermission;
  roles?: TenantRole[];
  mvp?: boolean; // If false, hidden behind feature flag
}

// Role-specific navigation - each role sees different items
const ROLE_NAV_CONFIG: Record<TenantRole, string[]> = {
  exporter: [
    'Overview',
    'DDS Packages',
    'Harvests',
    'Plots',
    'Farmers',
    'FPIC',
    'Requests',
    'Contacts',
    'Compliance',
    'Role Decisions',
    'Reports',
    'Audit Log',
    'Integrations',
    'Admin',
  ],
  importer: [
    'Overview',
    'DDS Packages',
    'Requests',
    'Contacts',
    'Compliance',
    'Role Decisions',
    'Reports',
    'Audit Log',
  ],
  cooperative: [
    'Overview',
    'Harvests',
    'Plots',
    'Farmers',
    'FPIC',
    'Requests',
    'Contacts',
    'Compliance',
  ],
  country_reviewer: [
    'Overview',
    'DDS Packages',
    'Plots',
    'Compliance',
    'Role Decisions',
    'Reports',
    'Audit Log',
  ],
};

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Overview', href: '/', icon: 'LayoutDashboard', permission: 'plots:view', mvp: true },
  { name: 'DDS Packages', href: '/packages', icon: 'Package', permission: 'packages:view', mvp: true },
  { name: 'Harvests', href: '/harvests', icon: 'Wheat', permission: 'harvests:view', mvp: true },
  { name: 'Plots', href: '/plots', icon: 'MapPin', permission: 'plots:view', mvp: true },
  { name: 'Farmers', href: '/farmers', icon: 'Users', permission: 'farmers:view', mvp: true },
  { name: 'FPIC', href: '/fpic', icon: 'FileCheck', permission: 'fpic:view', mvp: true },
  { name: 'Requests', href: '/requests', icon: 'Send', permission: 'requests:view', mvp: true },
  { name: 'Contacts', href: '/contacts', icon: 'Users', permission: 'contacts:view', mvp: true },
  { name: 'Compliance', href: '/compliance', icon: 'ShieldCheck', permission: 'compliance:view', mvp: true },
  { name: 'Role Decisions', href: '/role-decisions', icon: 'Scale', permission: 'roles:view_decisions', mvp: true },
  { name: 'Reports', href: '/reports', icon: 'FileText', permission: 'reports:view', mvp: true },
  { name: 'Audit Log', href: '/audit-log', icon: 'History', permission: 'audit:view', mvp: true },
  { name: 'Integrations', href: '/integrations', icon: 'Zap', permission: 'admin:view', mvp: true },
  { name: 'Admin', href: '/admin', icon: 'Shield', permission: 'admin:view', mvp: true },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: 'Settings', permission: 'settings:view', mvp: true },
  { name: 'Help', href: '/help', icon: 'HelpCircle', permission: 'plots:view', mvp: true },
];

// ============================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================

/**
 * Check if a user has a specific commercial permission
 */
export function hasPermission(user: User | null, permission: CommercialPermission): boolean {
  if (!user) return false;
  const rolePermissions = PERMISSION_MATRIX[user.active_role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: CommercialPermission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: CommercialPermission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Check if a legal workflow role has a specific legal permission
 */
export function hasLegalPermission(
  role: LegalWorkflowRole,
  permission: LegalWorkflowPermission
): boolean {
  const rolePermissions = LEGAL_ROLE_PERMISSION_MATRIX[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a workflow can proceed based on legal role
 * PENDING_MANUAL_CLASSIFICATION blocks all legal actions
 */
export function canProceedWithWorkflow(role: LegalWorkflowRole): boolean {
  return role !== 'PENDING_MANUAL_CLASSIFICATION' && role !== 'OUT_OF_SCOPE';
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: TenantRole): CommercialPermission[] {
  return PERMISSION_MATRIX[role] || [];
}

/**
 * Get all permissions for a commercial tier
 */
export function getPermissionsForTier(tier: CommercialTier): CommercialPermission[] {
  return TIER_PERMISSION_MATRIX[tier] || [];
}

/**
 * Get navigation items visible to the user based on their role
 */
export function getVisibleNavItems(user: User | null): NavItem[] {
  if (!user) return [];
  const allowedItems = ROLE_NAV_CONFIG[user.active_role] || [];
  return NAVIGATION_ITEMS.filter((item) => allowedItems.includes(item.name) && isRouteEnabled(item.href));
}

/**
 * Get secondary navigation items visible to the user
 */
export function getVisibleSecondaryNavItems(user: User | null): NavItem[] {
  if (!user) return [];
  return SECONDARY_NAV_ITEMS.filter((item) => hasPermission(user, item.permission));
}

// ============================================================
// ROLE DISPLAY FUNCTIONS
// ============================================================

/**
 * Get legacy role display name
 */
export function getRoleDisplayName(role: TenantRole): string {
  const names: Record<TenantRole, string> = {
    exporter: 'Exporter',
    importer: 'Importer',
    cooperative: 'Cooperative',
    country_reviewer: 'Country Reviewer',
    sponsor: 'Network Sponsor',
  };
  return names[role] || role;
}

/**
 * Get legal workflow role display name
 */
export function getLegalRoleDisplayName(role: LegalWorkflowRole): string {
  const names: Record<LegalWorkflowRole, string> = {
    OUT_OF_SCOPE: 'Out of Scope',
    OPERATOR: 'Operator',
    MICRO_SMALL_PRIMARY_OPERATOR: 'Micro/Small Primary Operator',
    DOWNSTREAM_OPERATOR_FIRST: 'Downstream Operator (First)',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'Downstream Operator (Subsequent)',
    TRADER: 'Trader',
    PENDING_MANUAL_CLASSIFICATION: 'Pending Classification',
  };
  return names[role] || role;
}

/**
 * Get legal workflow role description
 */
export function getLegalRoleDescription(role: LegalWorkflowRole): string {
  const descriptions: Record<LegalWorkflowRole, string> = {
    OUT_OF_SCOPE: 'Product not in EUDR Annex I scope',
    OPERATOR: 'First person placing product on EU market or exporting',
    MICRO_SMALL_PRIMARY_OPERATOR: 'Operator eligible for simplified primary-operator pathway',
    DOWNSTREAM_OPERATOR_FIRST: 'First downstream operator receiving covered goods',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'Later downstream operator in covered chain',
    TRADER: 'Making products available without operator/downstream role',
    PENDING_MANUAL_CLASSIFICATION: 'Legal role cannot be resolved - manual review required',
  };
  return descriptions[role] || '';
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: TenantRole): string {
  const colors: Record<TenantRole, string> = {
    exporter: 'bg-blue-500/20 text-blue-300',
    importer: 'bg-purple-500/20 text-purple-300',
    cooperative: 'bg-amber-500/20 text-amber-300',
    country_reviewer: 'bg-red-500/20 text-red-300',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

/**
 * Get legal role badge color class
 */
export function getLegalRoleBadgeColor(role: LegalWorkflowRole): string {
  const colors: Record<LegalWorkflowRole, string> = {
    OUT_OF_SCOPE: 'bg-gray-500/20 text-gray-400',
    OPERATOR: 'bg-emerald-500/20 text-emerald-300',
    MICRO_SMALL_PRIMARY_OPERATOR: 'bg-teal-500/20 text-teal-300',
    DOWNSTREAM_OPERATOR_FIRST: 'bg-blue-500/20 text-blue-300',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'bg-sky-500/20 text-sky-300',
    TRADER: 'bg-purple-500/20 text-purple-300',
    PENDING_MANUAL_CLASSIFICATION: 'bg-red-500/20 text-red-300',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

// ============================================================
// WORKFLOW TRANSITION FUNCTIONS
// ============================================================

/**
 * Check if user can transition package to a specific status
 */
export function canTransitionPackage(
  user: User | null,
  fromStatus: ShipmentStatus,
  toStatus: ShipmentStatus
): boolean {
  if (!user) return false;

  const transitions: Record<TenantRole, Partial<Record<ShipmentStatus, ShipmentStatus[]>>> = {
    exporter: {
      DRAFT: ['READY', 'ON_HOLD'],
      READY: ['DRAFT', 'SEALED', 'ON_HOLD'],
      SEALED: ['SUBMITTED', 'ON_HOLD'],
      SUBMITTED: ['ACCEPTED', 'REJECTED', 'ON_HOLD'],
      REJECTED: ['DRAFT', 'ON_HOLD'],
      ON_HOLD: ['DRAFT', 'READY'],
    },
    importer: {},
    cooperative: {},
    country_reviewer: {
      SUBMITTED: ['ACCEPTED', 'REJECTED', 'ON_HOLD'],
    },
  };

  const allowed = transitions[user.active_role]?.[fromStatus] || [];
  return allowed.includes(toStatus);
}

/**
 * Get the workflow type for a legal role
 */
export function getWorkflowTypeForRole(role: LegalWorkflowRole): WorkflowType {
  const mapping: Record<LegalWorkflowRole, WorkflowType> = {
    OUT_OF_SCOPE: 'OUT_OF_SCOPE_WORKFLOW',
    OPERATOR: 'DDS_WORKFLOW',
    MICRO_SMALL_PRIMARY_OPERATOR: 'SIMPLIFIED_DECLARATION_WORKFLOW',
    DOWNSTREAM_OPERATOR_FIRST: 'DOWNSTREAM_REFERENCE_WORKFLOW',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'DOWNSTREAM_REFERENCE_WORKFLOW',
    TRADER: 'TRADER_RETENTION_WORKFLOW',
    PENDING_MANUAL_CLASSIFICATION: 'MANUAL_HOLD_WORKFLOW',
  };
  return mapping[role];
}

// ============================================================
// ROLE DECISION ENGINE (Section 6)
// ============================================================

/**
 * Determine legal role for a workflow
 * This is a simplified client-side version - full logic runs server-side
 */
export function determineRoleDecision(
  hasUpstreamDDS: boolean,
  isFirstPlacement: boolean,
  isEligibleForSimplifiedPath: boolean,
  isFirstDownstreamEvent: boolean
): { role: LegalWorkflowRole; workflow: WorkflowType; holdReason?: string } {
  // Step 1: Check upstream DDS coverage
  if (!hasUpstreamDDS && !isFirstPlacement) {
    return {
      role: 'PENDING_MANUAL_CLASSIFICATION',
      workflow: 'MANUAL_HOLD_WORKFLOW',
      holdReason: 'No valid upstream DDS coverage and not first placement',
    };
  }

  // Step 2-4: First placement logic
  if (isFirstPlacement && !hasUpstreamDDS) {
    if (isEligibleForSimplifiedPath) {
      return {
        role: 'MICRO_SMALL_PRIMARY_OPERATOR',
        workflow: 'SIMPLIFIED_DECLARATION_WORKFLOW',
      };
    }
    return {
      role: 'OPERATOR',
      workflow: 'DDS_WORKFLOW',
    };
  }

  // Step 5-7: Downstream logic
  if (hasUpstreamDDS) {
    if (isFirstDownstreamEvent) {
      return {
        role: 'DOWNSTREAM_OPERATOR_FIRST',
        workflow: 'DOWNSTREAM_REFERENCE_WORKFLOW',
      };
    }
    return {
      role: 'DOWNSTREAM_OPERATOR_SUBSEQUENT',
      workflow: 'DOWNSTREAM_REFERENCE_WORKFLOW',
    };
  }

  // Fallback to manual classification
  return {
    role: 'PENDING_MANUAL_CLASSIFICATION',
    workflow: 'MANUAL_HOLD_WORKFLOW',
    holdReason: 'Unable to determine role automatically',
  };
}
