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
import { useAuth } from '@/lib/auth-context';

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
  step: {
    label: string;
    description: string;
    ctaHref: string;
    ctaLabel: string;
  };
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
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const isExporter = user?.active_role === 'exporter';
  const isSponsor = user?.active_role === 'sponsor';
  const {
    phase,
    config,
    completedSteps,
    resumeTour,
    showChecklist,
  } = useOnboarding();

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = user ? `tracebud_getting_started_hidden_${user.id}` : null;
  const dismissedFromStorage =
    typeof window !== 'undefined' && dismissKey ? window.sessionStorage.getItem(dismissKey) === '1' : false;
  const hasAction = (actionKey: string) =>
    typeof window !== 'undefined' && window.sessionStorage.getItem(`tracebud_onboarding_action_${actionKey}`) === '1';

  if (!showChecklist || dismissed || dismissedFromStorage) return null;

  const firstOverviewStepKey = config?.steps[0]?.key ?? null;

  const taskList = isSponsor ? [
    {
      key: 'finish_overview',
      label: 'Finish sponsor overview',
      description: 'Review governance KPIs, intervention alerts, and sponsor network posture.',
      ctaHref: '/',
      ctaLabel: 'Open overview',
      done: firstOverviewStepKey ? Boolean(completedSteps[firstOverviewStepKey]) : phase === 'complete',
    },
    {
      key: 'map_organisations',
      label: 'Map organisations',
      description: 'Validate member organisations and sponsor-covered scope across the governed network.',
      ctaHref: '/organisations',
      ctaLabel: 'Open organisations',
      done: hasAction('contacts_uploaded'),
    },
    {
      key: 'launch_programme_campaign',
      label: 'Launch programme campaign',
      description: 'Send your first bulk programme campaign to upstream organisations.',
      ctaHref: '/programmes',
      ctaLabel: 'Open programmes',
      done: hasAction('campaign_created'),
    },
  ] as const : [
    {
      key: 'finish_overview',
      label: 'Finish overview',
      description: 'Complete the first overview step of the guided onboarding flow.',
      ctaHref: '/',
      ctaLabel: 'Resume tour',
      done: firstOverviewStepKey ? Boolean(completedSteps[firstOverviewStepKey]) : phase === 'complete',
    },
    {
      key: 'add_producers',
      label: isImporter ? 'Build network' : isExporter ? 'Add producers' : 'Build member directory',
      description: isImporter
        ? 'Add counterpart contacts so campaign and request workflows route correctly.'
        : isExporter
          ? 'Build your producer directory so traceability links and requests route correctly.'
          : 'Create cooperative member records for consent, portability, and aggregation workflows.',
      ctaHref: isImporter ? '/contacts' : isExporter ? '/farmers' : '/contacts',
      ctaLabel: isImporter ? 'Go to network' : isExporter ? 'Go to producers' : 'Go to members',
      done: hasAction('contacts_uploaded'),
    },
    {
      key: 'launch_first_workflow',
      label: isImporter ? 'Launch campaign' : isExporter ? 'Start campaign' : 'Start a campaign',
      description: isImporter
        ? 'Start your first campaign to collect missing upstream evidence.'
        : isExporter
          ? 'Launch your first campaign to collect missing plot, evidence, and upstream producer data.'
          : 'Launch your first campaign to collect missing plot geometry, evidence, and member data.',
      ctaHref: '/outreach',
      ctaLabel: 'Go to campaigns',
      done: hasAction('campaign_created'),
    },
  ] as const;

  const totalSteps = taskList.length;
  const completedCount = taskList.filter((task) => task.done).length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;
  const firstIncompleteIndex = taskList.findIndex((task) => !task.done);

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissKey && typeof window !== 'undefined') {
      window.sessionStorage.setItem(dismissKey, '1');
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">

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
                ? 'Your workspace is fully configured.'
                : 'Complete these 3 starter tasks to activate your workflow.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Hide getting started widget"
            >
              <X className="h-4 w-4" />
            </button>
            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
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
            {taskList.map((step, index) => (
              <div key={step.key} role="listitem">
                <StepRow
                  step={step}
                  isComplete={step.done}
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
