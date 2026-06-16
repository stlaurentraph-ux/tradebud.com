'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TenantRole } from '@/types';
import {
  countCompletedVirginSteps,
  getVirginStepCount,
  readVirginOnboardingFlags,
  type VirginProgressSignals,
} from '@/lib/virgin-state-progress';
import { LocaleContext } from '@/lib/locale-context';
import {
  getVirginStateHeadingCopy,
  getVirginStateShellCopy,
  getVirginStepsForRole,
} from '@/lib/virgin-state-copy';

interface VirginStatePanelProps {
  role: TenantRole;
  progress?: VirginProgressSignals;
}

export function VirginStatePanel({ role, progress = {} }: VirginStatePanelProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const steps = getVirginStepsForRole(role, t);
  const onboardingFlags = readVirginOnboardingFlags();
  const completedSteps = countCompletedVirginSteps(role, { ...progress, ...onboardingFlags });
  const totalSteps = getVirginStepCount(role);
  const activeStepIndex = Math.min(completedSteps, totalSteps - 1);
  const currentStepNumber = Math.min(completedSteps + 1, totalSteps);

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-emerald-950">
              {getVirginStateHeadingCopy(role, 'title', t)}
            </CardTitle>
            <CardDescription className="mt-1 text-emerald-800/80">
              {getVirginStateHeadingCopy(role, 'description', t)}
            </CardDescription>
            <p className="mt-2 text-xs font-medium text-emerald-800">
              {getVirginStateShellCopy('step_progress', t, { current: currentStepNumber, total: totalSteps })}
              {completedSteps > 0
                ? ` · ${getVirginStateShellCopy('completed_count', t, { count: completedSteps })}`
                : ''}
            </p>
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${Math.round((completedSteps / totalSteps) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const isComplete = index < completedSteps;
          const isActive = index === activeStepIndex && !isComplete;
          const isLocked = index > activeStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
                isActive && 'border-emerald-300 bg-white shadow-sm',
                isComplete && 'border-emerald-100 bg-emerald-50/50 opacity-80',
                isLocked && 'border-dashed bg-muted/30 opacity-60',
              )}
            >
              <div className="flex gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isComplete && 'bg-emerald-600 text-white',
                    isActive && 'bg-emerald-600 text-white',
                    isLocked && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                  {isLocked ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {getVirginStateShellCopy('unlocks_after', t, { step: index })}
                    </p>
                  ) : null}
                </div>
              </div>
              {isActive ? (
                <Button asChild className="shrink-0">
                  <Link href={step.href}>
                    {step.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              {isComplete ? (
                <span className="text-xs font-medium text-emerald-700">
                  {getVirginStateShellCopy('completed', t)}
                </span>
              ) : null}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">{getVirginStateShellCopy('focus_hint', t)}</p>
      </CardContent>
    </Card>
  );
}
