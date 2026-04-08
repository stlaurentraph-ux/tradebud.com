import type { PackageStatus, ComplianceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface PackageStatusBadgeProps {
  status: PackageStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PackageStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In Review', className: 'bg-chart-2/20 text-chart-2' },
  preflight_check: { label: 'Pre-flight Check', className: 'bg-chart-3/20 text-chart-3' },
  traces_ready: { label: 'TRACES Ready', className: 'bg-primary/20 text-primary' },
  submitted: { label: 'Submitted', className: 'bg-chart-5/20 text-chart-5' },
  approved: { label: 'Approved', className: 'bg-primary/20 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive' },
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
  status: ComplianceStatus;
  size?: 'sm' | 'md';
}

const complianceConfig: Record<ComplianceStatus, { label: string; className: string }> = {
  passed: { label: 'Passed', className: 'bg-primary/20 text-primary' },
  warnings: { label: 'Warnings', className: 'bg-chart-3/20 text-chart-3' },
  blocked: { label: 'Blocked', className: 'bg-destructive/20 text-destructive' },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
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
