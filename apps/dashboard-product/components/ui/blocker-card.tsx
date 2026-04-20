'use client';

import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertOctagon, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * BlockerCard - Workflow impedance alert
 * 
 * Displays blocking issues with severity, description, remediation actions, and SLA countdown
 * per UX_POLISH_SPECIFICATION Section B.3
 */

const blockerCardVariants = cva(
  'relative flex items-start gap-4 p-4 rounded-lg border-l-4',
  {
    variants: {
      severity: {
        BLOCKING: 'bg-red-50 border-l-red-600',
        WARNING: 'bg-amber-50 border-l-amber-500',
      },
    },
    defaultVariants: {
      severity: 'WARNING',
    },
  }
);

export type BlockerType = 'COMPLIANCE_ISSUE' | 'YIELD_FAILURE' | 'MISSING_CONSENT' | 'INVALID_STATE';

export interface BlockerCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof blockerCardVariants> {
  blockerType: BlockerType;
  severity: 'BLOCKING' | 'WARNING';
  title: string;
  description: string;
  relatedEntityId?: string;
  relatedEntityLabel?: string;
  remediationAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  slaCountdown?: string | null;
}

const BLOCKER_TYPE_LABELS: Record<BlockerType, string> = {
  COMPLIANCE_ISSUE: 'Compliance issue',
  YIELD_FAILURE: 'Yield failure',
  MISSING_CONSENT: 'Missing consent',
  INVALID_STATE: 'Invalid state',
};

export function BlockerCard({
  blockerType,
  severity,
  title,
  description,
  relatedEntityId,
  relatedEntityLabel,
  remediationAction,
  secondaryAction,
  dismissible = false,
  onDismiss,
  slaCountdown,
  className,
  ...props
}: BlockerCardProps) {
  const Icon = severity === 'BLOCKING' ? AlertOctagon : AlertTriangle;
  const iconColor = severity === 'BLOCKING' ? 'text-red-600' : 'text-amber-600';
  const titleColor = severity === 'BLOCKING' ? 'text-red-900' : 'text-amber-900';
  const descColor = severity === 'BLOCKING' ? 'text-red-700' : 'text-amber-700';

  return (
    <div
      className={cn(blockerCardVariants({ severity }), className)}
      aria-label={`Blocker: ${BLOCKER_TYPE_LABELS[blockerType]}`}
      {...props}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
              severity === 'BLOCKING'
                ? 'bg-red-200 text-red-800'
                : 'bg-amber-200 text-amber-800'
            )}
          >
            {severity}
          </span>
          <span className={cn('font-semibold', titleColor)}>{title}</span>
        </div>

        {/* Description */}
        <p className={cn('text-sm mt-1', descColor)}>{description}</p>

        {/* Related entity */}
        {relatedEntityLabel && (
          <p className="text-xs text-muted-foreground mt-1">
            Linked to: {relatedEntityLabel}
            {relatedEntityId && (
              <span className="ml-1 font-mono text-[10px]">({relatedEntityId})</span>
            )}
          </p>
        )}

        {/* SLA countdown */}
        {slaCountdown && (
          <p className="text-xs font-medium mt-1">
            <span className={severity === 'BLOCKING' ? 'text-red-700' : 'text-amber-700'}>
              Due: {slaCountdown}
            </span>
          </p>
        )}

        {/* Actions */}
        {(remediationAction || secondaryAction) && (
          <div className="flex items-center gap-2 mt-3">
            {remediationAction && (
              remediationAction.href ? (
                <Button
                  size="sm"
                  variant={severity === 'BLOCKING' ? 'destructive' : 'default'}
                  asChild
                >
                  <Link href={remediationAction.href}>
                    {remediationAction.label}
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={severity === 'BLOCKING' ? 'destructive' : 'default'}
                  onClick={remediationAction.onClick}
                >
                  {remediationAction.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'absolute top-3 right-3 p-1 rounded hover:bg-black/5 transition-colors',
            severity === 'BLOCKING' ? 'text-red-600' : 'text-amber-600'
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { blockerCardVariants };
