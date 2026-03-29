'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from '@/lib/rbac';

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * Permission gate component that conditionally renders children
 * based on user permissions
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();

  // Single permission check
  if (permission) {
    if (!hasPermission(user, permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // No permissions specified, render children
  return <>{children}</>;
}

/**
 * Hook to check permissions in component logic
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

/**
 * Hook to check multiple permissions
 */
export function usePermissions(permissions: Permission[], requireAll = false): boolean {
  const { user } = useAuth();
  return requireAll
    ? hasAllPermissions(user, permissions)
    : hasAnyPermission(user, permissions);
}
