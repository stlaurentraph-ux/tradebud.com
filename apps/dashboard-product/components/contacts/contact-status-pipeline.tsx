'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ContactStatus } from '@/lib/contact-service';
import {
  CONTACT_PIPELINE_STATUSES,
  getContactPipelineStepIndex,
  isContactPipelineStatus,
} from '@/lib/contact-status-pipeline';
import { getContactStatusLabel } from '@/lib/workflow-terminology-labels';

type ContactStatusPipelineProps = {
  status: ContactStatus;
  t?: (key: string) => string;
  variant?: 'compact' | 'full';
  className?: string;
};

function terminalBadgeVariant(status: ContactStatus): 'destructive' | 'secondary' {
  return status === 'blocked' ? 'destructive' : 'secondary';
}

export function ContactStatusPipeline({
  status,
  t,
  variant = 'compact',
  className,
}: ContactStatusPipelineProps) {
  const label = getContactStatusLabel(status, t);

  if (!isContactPipelineStatus(status)) {
    return (
      <Badge variant={terminalBadgeVariant(status)} className={className}>
        {label}
      </Badge>
    );
  }

  const currentIndex = getContactPipelineStepIndex(status);

  return (
    <div
      className={cn('inline-flex flex-col gap-1', className)}
      role="group"
      aria-label={`${label} — supplier onboarding pipeline`}
      data-testid="contact-status-pipeline"
      data-status={status}
    >
      <div className="flex items-center gap-1">
        {CONTACT_PIPELINE_STATUSES.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === CONTACT_PIPELINE_STATUSES.length - 1;
          return (
            <div key={step} className="flex items-center gap-1">
              <span
                title={getContactStatusLabel(step, t)}
                className={cn(
                  'rounded-full transition-colors',
                  variant === 'full' ? 'h-2.5 w-2.5' : 'h-2 w-2',
                  isComplete && 'bg-emerald-500',
                  isCurrent && 'bg-primary ring-2 ring-primary/25',
                  !isComplete && !isCurrent && 'bg-muted-foreground/25',
                )}
                aria-hidden
              />
              {!isLast ? (
                <span
                  className={cn(
                    'h-px rounded-full',
                    variant === 'full' ? 'w-4' : 'w-2.5',
                    isComplete ? 'bg-emerald-400/70' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {variant === 'full' ? (
        <div className="flex justify-between gap-2 text-[10px] leading-none text-muted-foreground">
          {CONTACT_PIPELINE_STATUSES.map((step) => (
            <span
              key={step}
              className={cn(
                'max-w-[4.5rem] truncate text-center',
                step === status && 'font-semibold text-foreground',
              )}
            >
              {getContactStatusLabel(step, t)}
            </span>
          ))}
        </div>
      ) : null}

      <span
        className={cn(
          'text-xs font-medium leading-tight',
          status === 'submitted' && 'text-emerald-700',
          status === 'engaged' && 'text-primary',
        )}
      >
        {label}
      </span>
    </div>
  );
}
