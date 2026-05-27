'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  steps: { label: string; description?: string }[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center">
      <nav aria-label="Progress">
        <ol className="flex items-center gap-2 sm:gap-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <li key={step.label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isCurrent && 'border-2 border-primary bg-background text-primary',
                      !isCompleted &&
                        !isCurrent &&
                        'border-2 border-muted bg-background text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn('ml-2 h-0.5 w-8 sm:ml-4 sm:w-12', isCompleted ? 'bg-primary' : 'bg-muted')} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
