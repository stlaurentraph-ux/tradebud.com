import type { TenantRole } from '@/types';
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: TenantRole;
  size?: 'sm' | 'md';
  className?: string;
}

export function RoleBadge({ role, size = 'sm', className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        getRoleBadgeColor(role),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {getRoleDisplayName(role)}
    </span>
  );
}
