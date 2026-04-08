import type { ShipmentStatus, PackageComplianceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface PackageStatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ShipmentStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  READY: { label: 'Ready', className: 'bg-chart-2/20 text-chart-2' },
  SEALED: { label: 'Sealed', className: 'bg-primary/20 text-primary' },
  SUBMITTED: { label: 'Submitted', className: 'bg-chart-5/20 text-chart-5' },
  ACCEPTED: { label: 'Accepted', className: 'bg-primary/20 text-primary' },
  REJECTED: { label: 'Rejected', className: 'bg-destructive/20 text-destructive' },
  ARCHIVED: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  ON_HOLD: { label: 'On Hold', className: 'bg-chart-3/20 text-chart-3' },
};

export function PackageStatusBadge({ status, size = 'sm' }: PackageStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}

interface ComplianceStatusBadgeProps {
  status: PackageComplianceStatus;
  size?: 'sm' | 'md';
}

const complianceConfig: Record<PackageComplianceStatus, { label: string; className: string }> = {
  PASSED: { label: 'Passed', className: 'bg-primary/20 text-primary' },
  WARNINGS: { label: 'Warnings', className: 'bg-chart-3/20 text-chart-3' },
  BLOCKED: { label: 'Blocked', className: 'bg-destructive/20 text-destructive' },
  PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
};

export function ComplianceStatusBadge({ status, size = 'sm' }: ComplianceStatusBadgeProps) {
  const config = complianceConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}
