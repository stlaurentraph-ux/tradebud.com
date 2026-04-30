'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_ICONS, STATUS_LABELS, type StatusType } from '@/lib/constants/status';

/**
 * StatusChip - Canonical entity state indicator
 *
 * Maps directly to spec state enums:
 * - shipment_headers: DRAFT → READY → SEALED → SUBMITTED → ACCEPTED/REJECTED → ARCHIVED or ON_HOLD
 * - dds_records: DRAFT → READY_TO_SUBMIT → SUBMITTED → ACCEPTED/REJECTED/PENDING_CONFIRMATION (+ amend/withdraw states)
 * - compliance_issues: OPEN → IN_PROGRESS → RESOLVED/ESCALATED
 * - yield_exception_requests: PENDING → APPROVED → REJECTED
 */

const statusChipVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
  {
    variants: {
      status: {
        // Shipment states
        DRAFT: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        READY: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        SEALED: 'bg-indigo-100 text-indigo-700 focus:ring-indigo-400',
        ARCHIVED: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        ON_HOLD: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        // DDS states
        READY_TO_SUBMIT: 'bg-indigo-100 text-indigo-700 focus:ring-indigo-400',
        PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        AMENDMENT_DRAFT: 'bg-purple-100 text-purple-700 focus:ring-purple-400',
        AMENDED_SUBMITTED: 'bg-purple-100 text-purple-700 focus:ring-purple-400',
        WITHDRAWAL_REQUESTED: 'bg-orange-100 text-orange-700 focus:ring-orange-400',
        WITHDRAWN: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        SUPERSEDED: 'bg-gray-100 text-gray-700 focus:ring-gray-400',
        PENDING: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        SUBMITTED: 'bg-blue-100 text-blue-700 focus:ring-blue-400',
        ACCEPTED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        REJECTED: 'bg-red-100 text-red-700 focus:ring-red-400',
        // Compliance issue states
        OPEN: 'bg-red-100 text-red-700 focus:ring-red-400',
        RESOLVED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        ESCALATED: 'bg-orange-100 text-orange-700 focus:ring-orange-400',
        // Yield exception states
        APPROVED: 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400',
        UNAVAILABLE: 'bg-amber-100 text-amber-700 focus:ring-amber-400',
        BLOCKED: 'bg-red-100 text-red-700 focus:ring-red-400',
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

// Re-export StatusType for backwards compatibility
export type { StatusType } from '@/lib/constants/status';

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
