'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
  BookOpen,
  LifeBuoy,
  Video,
  X,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/lib/onboarding-context';
import type { OnboardingStep } from '@/lib/onboarding-config';

// ─────────────────────────────────────────────────────────────
// Help links (shown in footer)
// ─────────────────────────────────────────────────────────────

const HELP_LINKS = [
  { label: 'Documentation', icon: BookOpen, href: 'https://docs.tracebud.com', external: true },
  { label: 'Support', icon: LifeBuoy, href: 'https://tracebud.com/support', external: true },
  { label: 'Video walkthrough', icon: Video, href: 'https://tracebud.com/demo-video', external: true },
];

// ─────────────────────────────────────────────────────────────
// Step row
// ─────────────────────────────────────────────────────────────

interface StepRowProps {
  step: OnboardingStep;
  isComplete: boolean;
  isActive: boolean;
  index: number;
}

function StepRow({ step, isComplete, isActive, index }: StepRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
        isActive && !isComplete ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50',
        isComplete ? 'opacity-70' : '',
      )}
    >
      {/* Check icon */}
      <div className="mt-0.5 shrink-0">
        {isComplete ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" aria-label="Completed" />
        ) : (
          <Circle
            className={cn('h-4.5 w-4.5', isActive ? 'text-primary' : 'text-muted-foreground/40')}
            aria-label="Incomplete"
          />
        )}
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm font-medium leading-snug',
              isComplete ? 'text-muted-foreground line-through' : 'text-foreground',
            )}
          >
            {step.label}
          </span>
          {isActive && !isComplete && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
              Next
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{step.description}</p>
        {isActive && !isComplete && (
          <Link
            href={step.ctaHref}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:underline"
          >
            {step.ctaLabel}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Step number pill */}
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
          isComplete
            ? 'bg-emerald-100 text-emerald-700'
            : isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {index + 1}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function OnboardingChecklistCard() {
  const {
    phase,
    config,
    completedSteps,
    completedCount,
    progress,
    resumeTour,
    showChecklist,
  } = useOnboarding();

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!showChecklist || !config || dismissed) return null;

  const totalSteps = config.steps.length;
  const isComplete = phase === 'complete';
  const firstIncompleteIndex = config.steps.findIndex((s) => !completedSteps[s.key]);

  return (
    <Card className="relative border-border bg-card shadow-sm">
      {/* Dismiss (only when fully complete) */}
      {isComplete && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          {/* Title + badge */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {isComplete ? 'Setup complete' : 'Getting started'}
              </h3>
              {isComplete ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  <PartyPopper className="mr-1 h-3 w-3" />
                  All done
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalSteps}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              {isComplete
                ? `Your ${config.displayName} workspace is fully configured.`
                : config.tagline}
            </p>
          </div>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isComplete ? 'bg-emerald-500' : 'bg-primary',
              )}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% complete`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>{completedCount} of {totalSteps} steps</span>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-4 pb-4 pt-3 space-y-1">
          {/* Step list */}
          <div className="space-y-0.5" role="list" aria-label="Onboarding steps">
            {config.steps.map((step, index) => (
              <div key={step.key} role="listitem">
                <StepRow
                  step={step}
                  isComplete={completedSteps[step.key] ?? false}
                  isActive={index === firstIncompleteIndex}
                  index={index}
                />
              </div>
            ))}
          </div>

          {/* Resume tour CTA */}
          {!isComplete && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={resumeTour}
                className="w-full gap-2 text-xs"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Resume guided tour
              </Button>
            </div>
          )}

          {/* Help links */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Need help?</span>
            {HELP_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:underline"
              >
                <link.icon className="h-3 w-3" />
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
