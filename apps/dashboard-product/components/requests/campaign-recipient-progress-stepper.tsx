'use client';

import { Check, X } from 'lucide-react';
import {
  type CampaignRecipientProgressStep,
} from '@/lib/campaign-recipient-timeline';
import {
  getCampaignRecipientProgressStepLabel,
  type TranslateFn,
} from '@/lib/workflow-terminology-labels';
import { cn } from '@/lib/utils';

type CampaignRecipientProgressStepperProps = {
  steps: CampaignRecipientProgressStep[];
  compact?: boolean;
  t?: TranslateFn;
};

function stepDotClass(state: CampaignRecipientProgressStep['state']): string {
  switch (state) {
    case 'complete':
      return 'bg-primary text-primary-foreground';
    case 'current':
      return 'bg-primary text-primary-foreground ring-4 ring-primary/20 ring-offset-2';
    case 'refused':
      return 'bg-red-500 text-white';
    case 'skipped':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function connectorClass(leftState: CampaignRecipientProgressStep['state']): string {
  return leftState === 'complete' || leftState === 'skipped' ? 'bg-primary' : 'bg-muted';
}

export function CampaignRecipientProgressStepper({
  steps,
  compact = false,
  t,
}: CampaignRecipientProgressStepperProps) {
  return (
    <div
      className={cn('flex items-center', compact ? 'min-w-[9rem]' : 'min-w-[12rem]')}
      role="list"
      aria-label="Recipient onboarding progress"
    >
      {steps.map((step, index) => {
        const label = getCampaignRecipientProgressStepLabel(step.id, t);
        const isLast = index === steps.length - 1;
        return (
          <div key={step.id} className="flex flex-1 items-center" role="listitem">
            <div className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full',
                  compact ? 'h-5 w-5' : 'h-6 w-6',
                  stepDotClass(step.state),
                )}
                title={label}
                aria-label={`${label}: ${step.state}`}
                aria-current={step.state === 'current' ? 'step' : undefined}
              >
                {step.state === 'complete' || step.state === 'skipped' ? (
                  <Check className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
                ) : step.state === 'refused' ? (
                  <X className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
                ) : (
                  <span className={compact ? 'text-[9px] font-semibold' : 'text-[10px] font-semibold'}>
                    {index + 1}
                  </span>
                )}
              </div>
              {!compact ? (
                <span
                  className={cn(
                    'hidden text-center text-[10px] font-medium sm:block',
                    step.state === 'current' ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              ) : null}
            </div>
            {!isLast ? (
              <div
                className={cn('mx-0.5 h-0.5 min-w-[0.35rem] flex-1 rounded', connectorClass(step.state))}
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
