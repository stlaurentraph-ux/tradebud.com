import type { TenantRole, User } from '@/types';

// Permission actions for each resource
export type Permission =
  // Package permissions
  | 'packages:view'
  | 'packages:create'
  | 'packages:edit'
  | 'packages:delete'
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
  | 'admin:manage_roles';

// Role-based permission matrix
const PERMISSION_MATRIX: Record<TenantRole, Permission[]> = {
  exporter: [
    'packages:view',
    'packages:create',
    'packages:edit',
    'packages:delete',
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
    'reports:view',
    'reports:generate',
    'reports:export',
    'settings:view',
    'settings:edit',
    'admin:view',
    'admin:manage_users',
    'admin:manage_roles',
  ],
  importer: [
    'packages:view',
    'plots:view',
    'farmers:view',
    'compliance:view',
    'reports:view',
    'reports:export',
    'settings:view',
  ],
  cooperative: [
    'plots:view',
    'plots:create',
    'plots:edit',
    'plots:bulk_upload',
    'farmers:view',
    'farmers:create',
    'farmers:edit',
    'farmers:link_validation',
    'compliance:view',
    'reports:view',
    'settings:view',
  ],
  country_reviewer: [
    'packages:view',
    'packages:approve',
    'plots:view',
    'farmers:view',
    'compliance:view',
    'compliance:approve',
    'reports:view',
    'reports:generate',
    'reports:export',
    'settings:view',
  ],
};

// Navigation items visible per role
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permission: Permission;
  roles?: TenantRole[]; // If specified, only these roles see this item
}

// Role-specific navigation - each role sees different items
const ROLE_NAV_CONFIG: Record<TenantRole, string[]> = {
  exporter: ['Overview', 'DDS Packages', 'Plots', 'Farmers', 'Compliance', 'Reports', 'Admin'],
  importer: ['Overview', 'DDS Packages', 'Compliance', 'Reports'],
  cooperative: ['Overview', 'Plots', 'Farmers', 'Compliance'],
  country_reviewer: ['Overview', 'DDS Packages', 'Plots', 'Compliance', 'Reports'],
};

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Overview', href: '/', icon: 'LayoutDashboard', permission: 'plots:view' },
  { name: 'DDS Packages', href: '/packages', icon: 'Package', permission: 'packages:view' },
  { name: 'Plots', href: '/plots', icon: 'MapPin', permission: 'plots:view' },
  { name: 'Farmers', href: '/farmers', icon: 'Users', permission: 'farmers:view' },
  { name: 'Compliance', href: '/compliance', icon: 'ShieldCheck', permission: 'compliance:view' },
  { name: 'Reports', href: '/reports', icon: 'FileText', permission: 'reports:view' },
  { name: 'Admin', href: '/admin', icon: 'Shield', permission: 'admin:view' },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: 'Settings', permission: 'settings:view' },
  { name: 'Help', href: '/help', icon: 'HelpCircle', permission: 'plots:view' },
];

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  const rolePermissions = PERMISSION_MATRIX[user.active_role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: TenantRole): Permission[] {
  return PERMISSION_MATRIX[role] || [];
}

/**
 * Get navigation items visible to the user based on their role
 */
export function getVisibleNavItems(user: User | null): NavItem[] {
  if (!user) return [];
  const allowedItems = ROLE_NAV_CONFIG[user.active_role] || [];
  return NAVIGATION_ITEMS.filter((item) => allowedItems.includes(item.name));
}

/**
 * Get secondary navigation items visible to the user
 */
export function getVisibleSecondaryNavItems(user: User | null): NavItem[] {
  if (!user) return [];
  return SECONDARY_NAV_ITEMS.filter((item) => hasPermission(user, item.permission));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TenantRole): string {
  const names: Record<TenantRole, string> = {
    exporter: 'Exporter',
    importer: 'Importer',
    cooperative: 'Cooperative',
    country_reviewer: 'Country Reviewer',
  };
  return names[role] || role;
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: TenantRole): string {
  const colors: Record<TenantRole, string> = {
    exporter: 'bg-primary/20 text-primary',
    importer: 'bg-chart-2/20 text-chart-2',
    cooperative: 'bg-chart-3/20 text-chart-3',
    country_reviewer: 'bg-chart-5/20 text-chart-5',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

/**
 * Check if user can transition package to a specific status
 */
export function canTransitionPackage(
  user: User | null,
  fromStatus: string,
  toStatus: string
): boolean {
  if (!user) return false;

  const transitions: Record<TenantRole, Record<string, string[]>> = {
    exporter: {
      draft: ['in_review'],
      in_review: ['draft', 'preflight_check'],
      preflight_check: ['in_review', 'traces_ready'],
      traces_ready: ['preflight_check', 'submitted'],
    },
    importer: {},
    cooperative: {},
    country_reviewer: {
      submitted: ['approved', 'rejected'],
    },
  };

  const allowed = transitions[user.active_role]?.[fromStatus] || [];
  return allowed.includes(toStatus);
}
