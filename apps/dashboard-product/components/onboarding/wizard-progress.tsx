import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
  return (
    <div className="space-y-3">
      {/* Step counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-primary">
          {Math.round(((currentStep - 1) / totalSteps) * 100)}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentStep - 1}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <span
                  className={`hidden text-xs sm:block truncate ${
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
