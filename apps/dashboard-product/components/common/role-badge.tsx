'use client';

import type { TenantRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: TenantRole;
  size?: 'sm' | 'md';
  className?: string;
}

const ROLE_CONFIG: Record<TenantRole, { label: string; className: string }> = {
  exporter: {
    label: 'Exporter',
    className: 'bg-sky-400/25 text-sky-100 ring-1 ring-sky-400/30',
  },
  importer: {
    label: 'Importer',
    className: 'bg-violet-400/25 text-violet-100 ring-1 ring-violet-400/30',
  },
  cooperative: {
    label: 'Cooperative',
    className: 'bg-amber-400/25 text-amber-100 ring-1 ring-amber-400/30',
  },
  country_reviewer: {
    label: 'Reviewer',
    className: 'bg-rose-400/25 text-rose-100 ring-1 ring-rose-400/30',
  },
};

export function RoleBadge({ role, size = 'sm', className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 flex-shrink-0" />
      {config.label}
    </span>
  );
}
