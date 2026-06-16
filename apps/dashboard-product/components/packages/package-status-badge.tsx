'use client';

import type { ShipmentStatus, PackageComplianceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/locale-context';
import { useAuth } from '@/lib/auth-context';
import {
  getComplianceStatusLabel,
  getComplianceStatusStyles,
  getShipmentStatusLabel,
  getShipmentStatusStyles,
} from '@/lib/status-labels';

interface PackageStatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md';
}

export function PackageStatusBadge({ status, size = 'sm' }: PackageStatusBadgeProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const label = getShipmentStatusLabel(status, user?.active_role, t);
  const className = getShipmentStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {label}
    </span>
  );
}

interface ComplianceStatusBadgeProps {
  status: PackageComplianceStatus;
  size?: 'sm' | 'md';
}

export function ComplianceStatusBadge({ status, size = 'sm' }: ComplianceStatusBadgeProps) {
  const { t } = useLocale();
  const label = getComplianceStatusLabel(status, t);
  const className = getComplianceStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {label}
    </span>
  );
}
