'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Edit,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusChip - Canonical entity state indicator
 * 
 * Maps directly to spec state enums:
 * - shipment_headers: DRAFT → COLLECTING_DATA → VALIDATING → BLOCKED → READY_FOR_APPROVAL → APPROVED_FOR_FILING → FILED → FILING_FAILED → FILING_ACCEPTED
 * - dds_records: DRAFT → PENDING → SUBMITTED → ACCEPTED → REJECTED
 * - compliance_issues: OPEN → ASSIGNED → WAITING → UPDATED → RESOLVED → CLOSED
 * - yield_exception_requests: PENDING → APPROVED → REJECTED
 */

const statusChipVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
  {
    variants: {
      status: {
        // Shipment states
        DRAFT: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        COLLECTING_DATA: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        VALIDATING: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        BLOCKED: 'bg-red-100 text-red-700 focus:ring-red-400',
        READY_FOR_APPROVAL: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        APPROVED_FOR_FILING: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        FILED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        FILING_FAILED: 'bg-red-100 text-red-700 focus:ring-red-400',
        FILING_ACCEPTED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        // DDS states
        PENDING: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        SUBMITTED: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        ACCEPTED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        REJECTED: 'bg-red-100 text-red-700 focus:ring-red-400',
        // Compliance issue states
        OPEN: 'bg-red-100 text-red-700 focus:ring-red-400',
        ASSIGNED: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        WAITING: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        UPDATED: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        RESOLVED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        CLOSED: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        // Yield exception states
        APPROVED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        // Generic states
        IN_PROGRESS: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        SUCCESS: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        ERROR: 'bg-red-100 text-red-700 focus:ring-red-400',
        WARNING: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        INFO: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
      clickable: {
        true: 'cursor-pointer hover:shadow-md hover:ring-2',
        false: '',
      },
    },
    defaultVariants: {
      status: 'DRAFT',
      size: 'md',
      clickable: false,
    },
  }
);

export type StatusType =
  | 'DRAFT'
  | 'COLLECTING_DATA'
  | 'VALIDATING'
  | 'BLOCKED'
  | 'READY_FOR_APPROVAL'
  | 'APPROVED_FOR_FILING'
  | 'FILED'
  | 'FILING_FAILED'
  | 'FILING_ACCEPTED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'OPEN'
  | 'ASSIGNED'
  | 'WAITING'
  | 'UPDATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

const STATUS_ICONS: Record<StatusType, React.ElementType> = {
  DRAFT: Edit,
  COLLECTING_DATA: Download,
  VALIDATING: Clock,
  BLOCKED: AlertTriangle,
  READY_FOR_APPROVAL: CheckCircle,
  APPROVED_FOR_FILING: CheckCircle2,
  FILED: CheckCircle2,
  FILING_FAILED: X,
  FILING_ACCEPTED: Check,
  PENDING: Clock,
  SUBMITTED: Clock,
  ACCEPTED: Check,
  REJECTED: X,
  OPEN: AlertTriangle,
  ASSIGNED: Clock,
  WAITING: Clock,
  UPDATED: Clock,
  RESOLVED: CheckCircle,
  CLOSED: Check,
  APPROVED: Check,
  IN_PROGRESS: Clock,
  SUCCESS: Check,
  ERROR: X,
  WARNING: AlertTriangle,
  INFO: Clock,
};

const STATUS_LABELS: Record<StatusType, string> = {
  DRAFT: 'Draft',
  COLLECTING_DATA: 'Collecting data',
  VALIDATING: 'Validating',
  BLOCKED: 'Blocked',
  READY_FOR_APPROVAL: 'Ready for approval',
  APPROVED_FOR_FILING: 'Approved for filing',
  FILED: 'Filed',
  FILING_FAILED: 'Filing failed',
  FILING_ACCEPTED: 'Filing accepted',
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  WAITING: 'Waiting',
  UPDATED: 'Updated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In progress',
  SUCCESS: 'Success',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Info',
};

export interface StatusChipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof statusChipVariants> {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export function StatusChip({
  status,
  label,
  showIcon = true,
  loading = false,
  disabled = false,
  size,
  clickable,
  className,
  ...props
}: StatusChipProps) {
  const Icon = loading ? Loader2 : STATUS_ICONS[status];
  const displayLabel = label || STATUS_LABELS[status];

  return (
    <div
      role={clickable ? 'button' : 'status'}
      tabIndex={clickable ? 0 : undefined}
      aria-label={displayLabel}
      aria-disabled={disabled}
      className={cn(
        statusChipVariants({ status, size, clickable }),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className={cn(
            'flex-shrink-0',
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5',
            loading && 'animate-spin'
          )}
          aria-hidden="true"
        />
      )}
      <span>{loading ? 'pending...' : displayLabel}</span>
    </div>
  );
}

export { statusChipVariants };
