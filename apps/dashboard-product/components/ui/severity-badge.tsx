'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertOctagon, AlertTriangle, Info, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SeverityBadge - Compliance issue severity indicator with SLA countdown
 * 
 * Displays severity level, SLA remaining, owner, and blocking status
 * per UX_POLISH_SPECIFICATION Section B.2
 */

const severityBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold',
  {
    variants: {
      severity: {
        BLOCKING: 'bg-red-100 text-red-800',
        WARNING: 'bg-amber-100 text-amber-800',
        INFO: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      severity: 'INFO',
    },
  }
);

const SEVERITY_ICONS: Record<'BLOCKING' | 'WARNING' | 'INFO', React.ElementType> = {
  BLOCKING: AlertOctagon,
  WARNING: AlertTriangle,
  INFO: Info,
};

export type SeverityLevel = 'BLOCKING' | 'WARNING' | 'INFO';

export interface SeverityBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof severityBadgeVariants> {
  severity: SeverityLevel;
  slaHoursRemaining?: number | null;
  isOverdue?: boolean;
  ownerName?: string | null;
  blocksShipmentSealing?: boolean;
  showOwner?: boolean;
  showSla?: boolean;
  showBlockingIndicator?: boolean;
  compact?: boolean;
}

function formatSlaCountdown(hoursRemaining: number | null | undefined, isOverdue?: boolean): string {
  if (hoursRemaining === null || hoursRemaining === undefined) {
    return '';
  }
  
  if (isOverdue || hoursRemaining < 0) {
    const overdueDays = Math.abs(Math.floor(hoursRemaining / 24));
    if (overdueDays === 0) {
      return 'Overdue';
    }
    return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
  }
  
  if (hoursRemaining < 24) {
    return `${Math.floor(hoursRemaining)} hr${Math.floor(hoursRemaining) !== 1 ? 's' : ''} left`;
  }
  
  const days = Math.floor(hoursRemaining / 24);
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function getSlaColor(hoursRemaining: number | null | undefined, isOverdue?: boolean): string {
  if (isOverdue || (hoursRemaining !== null && hoursRemaining !== undefined && hoursRemaining < 0)) {
    return 'text-red-600 font-bold';
  }
  if (hoursRemaining === null || hoursRemaining === undefined) {
    return 'text-muted-foreground';
  }
  if (hoursRemaining < 24) {
    return 'text-red-600 font-semibold';
  }
  if (hoursRemaining < 72) {
    return 'text-amber-600 font-medium';
  }
  return 'text-emerald-600';
}

export function SeverityBadge({
  severity,
  slaHoursRemaining,
  isOverdue = false,
  ownerName,
  blocksShipmentSealing = false,
  showOwner = true,
  showSla = true,
  showBlockingIndicator = true,
  compact = false,
  className,
  ...props
}: SeverityBadgeProps) {
  const Icon = SEVERITY_ICONS[severity];
  const slaText = formatSlaCountdown(slaHoursRemaining, isOverdue);
  const slaColor = getSlaColor(slaHoursRemaining, isOverdue);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        <span className={cn(severityBadgeVariants({ severity }))}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          {severity}
        </span>
        {showSla && slaText && (
          <span className={cn('text-xs', slaColor)}>{slaText}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 text-xs', className)}
      {...props}
    >
      {/* Severity badge */}
      <span className={cn(severityBadgeVariants({ severity }))}>
        <Icon className="h-3 w-3" aria-hidden="true" />
        {severity}
      </span>

      {/* Owner badge */}
      {showOwner && ownerName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          <User className="h-3 w-3" aria-hidden="true" />
          {ownerName}
        </span>
      )}

      {/* Unassigned indicator */}
      {showOwner && !ownerName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
          <User className="h-3 w-3" aria-hidden="true" />
          Unassigned
        </span>
      )}

      {/* SLA countdown */}
      {showSla && slaText && (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50', slaColor)}>
          <Clock className="h-3 w-3" aria-hidden="true" />
          {isOverdue && <span className="mr-1">⚠️</span>}
          {slaText}
        </span>
      )}

      {/* Blocking indicator */}
      {showBlockingIndicator && blocksShipmentSealing && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
          Blocks shipment sealing
        </span>
      )}
    </div>
  );
}

export { severityBadgeVariants };
