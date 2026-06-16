'use client';

import { useContext, useState } from 'react';
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
import { readOnboardingFlag, writeOnboardingFlag } from '@/lib/onboarding-persistence';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  getOnboardingChecklistShellCopy,
  getOnboardingChecklistTaskCopy,
} from '@/lib/workflow-terminology-labels';
import type { User } from '@/types';

const HELP_LINKS = [
  { labelKey: 'help_docs' as const, icon: BookOpen, href: 'https://docs.tracebud.com' },
  { labelKey: 'help_support' as const, icon: LifeBuoy, href: 'https://tracebud.com/support' },
  { labelKey: 'help_video' as const, icon: Video, href: 'https://tracebud.com/demo-video' },
];

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
  t?: (key: string) => string;
}

function StepRow({ step, isComplete, isActive, index, t }: StepRowProps) {
  const rowContent = (
    <>
      <div className="mt-0.5 shrink-0">
        {isComplete ? (
          <CheckCircle2
            className="h-4.5 w-4.5 text-emerald-600"
            aria-label={getOnboardingChecklistShellCopy('aria_completed', t)}
          />
        ) : (
          <Circle
            className={cn('h-4.5 w-4.5', isActive ? 'text-primary' : 'text-muted-foreground/40')}
            aria-label={getOnboardingChecklistShellCopy('aria_incomplete', t)}
          />
        )}
      </div>

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
              {getOnboardingChecklistShellCopy('badge_next', t)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{step.description}</p>
        {!isComplete ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
            {step.ctaLabel}
            <ExternalLink className="h-3 w-3" />
          </span>
        ) : null}
      </div>

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
    </>
  );

  const rowClassName = cn(
    'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
    isActive && !isComplete ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50',
    isComplete ? 'opacity-70' : '',
    !isComplete ? 'cursor-pointer' : '',
  );

  if (!isComplete) {
    return (
      <Link href={step.ctaHref} className={rowClassName}>
        {rowContent}
      </Link>
    );
  }

  return <div className={rowClassName}>{rowContent}</div>;
}

export function OnboardingChecklistCard({ suppressWhenBlockers = false }: { suppressWhenBlockers?: boolean }) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role as User['active_role'];
  const isExporter = role === 'exporter';
  const isSponsor = role === 'sponsor';
  const { phase, config, completedSteps, resumeTour, showChecklist } = useOnboarding();

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = user ? `tracebud_getting_started_hidden_${user.id}` : null;
  const dismissedFromStorage =
    typeof window !== 'undefined' && dismissKey ? readOnboardingFlag(dismissKey) === '1' : false;
  const hasAction = (actionKey: string) =>
    typeof window !== 'undefined' && window.sessionStorage.getItem(`tracebud_onboarding_action_${actionKey}`) === '1';

  if (!showChecklist || dismissed || dismissedFromStorage || suppressWhenBlockers) return null;

  const firstOverviewStepKey = config?.steps[0]?.key ?? null;

  const taskList = isSponsor
    ? ([
        {
          key: 'finish_overview' as const,
          label: getOnboardingChecklistTaskCopy('finish_overview', 'label', role, t),
          description: getOnboardingChecklistTaskCopy('finish_overview', 'description', role, t),
          ctaHref: '/',
          ctaLabel: getOnboardingChecklistTaskCopy('finish_overview', 'cta', role, t),
          done: firstOverviewStepKey ? Boolean(completedSteps[firstOverviewStepKey]) : phase === 'complete',
        },
        {
          key: 'map_organisations' as const,
          label: getOnboardingChecklistTaskCopy('map_organisations', 'label', role, t),
          description: getOnboardingChecklistTaskCopy('map_organisations', 'description', role, t),
          ctaHref: '/organisations',
          ctaLabel: getOnboardingChecklistTaskCopy('map_organisations', 'cta', role, t),
          done: hasAction('contacts_uploaded'),
        },
        {
          key: 'launch_programme_campaign' as const,
          label: getOnboardingChecklistTaskCopy('launch_programme_campaign', 'label', role, t),
          description: getOnboardingChecklistTaskCopy('launch_programme_campaign', 'description', role, t),
          ctaHref: '/programmes?new=1',
          ctaLabel: getOnboardingChecklistTaskCopy('launch_programme_campaign', 'cta', role, t),
          done: hasAction('campaign_created'),
        },
      ] as const)
    : ([
        {
          key: 'launch_first_workflow' as const,
          label: getOnboardingChecklistTaskCopy('launch_first_workflow', 'label', role, t),
          description: getOnboardingChecklistTaskCopy('launch_first_workflow', 'description', role, t),
          ctaHref: '/outreach?new=1',
          ctaLabel: getOnboardingChecklistTaskCopy('launch_first_workflow', 'cta', role, t),
          done: hasAction('campaign_created'),
        },
        {
          key: 'add_producers' as const,
          label: getOnboardingChecklistTaskCopy('add_producers', 'label', role, t),
          description: getOnboardingChecklistTaskCopy('add_producers', 'description', role, t),
          ctaHref: isExporter ? '/farmers/new' : '/contacts/add?mode=contact',
          ctaLabel: getOnboardingChecklistTaskCopy('add_producers', 'cta', role, t),
          done: hasAction('contacts_uploaded'),
        },
      ] as const);

  const totalSteps = taskList.length;
  const completedCount = taskList.filter((task) => task.done).length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;
  const firstIncompleteIndex = taskList.findIndex((task) => !task.done);

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissKey && typeof window !== 'undefined') {
      writeOnboardingFlag(dismissKey, '1');
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {isComplete
                  ? getOnboardingChecklistShellCopy('title_complete', t)
                  : getOnboardingChecklistShellCopy('title_active', t)}
              </h3>
              {isComplete ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  <PartyPopper className="mr-1 h-3 w-3" />
                  {getOnboardingChecklistShellCopy('badge_all_done', t)}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalSteps}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              {isComplete
                ? getOnboardingChecklistShellCopy('subtitle_complete', t)
                : getOnboardingChecklistShellCopy('subtitle_active', t, { count: totalSteps })}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={getOnboardingChecklistShellCopy('hide_aria', t)}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? getOnboardingChecklistShellCopy('expand_aria', t)
                  : getOnboardingChecklistShellCopy('collapse_aria', t)
              }
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

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
              aria-label={getOnboardingChecklistShellCopy('progress_aria', t, { progress })}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{getOnboardingChecklistShellCopy('progress_label', t, { progress })}</span>
            <span>
              {getOnboardingChecklistShellCopy('steps_of', t, { completed: completedCount, total: totalSteps })}
            </span>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-4 pb-4 pt-3 space-y-1">
          <div className="space-y-0.5" role="list" aria-label={getOnboardingChecklistShellCopy('steps_list_aria', t)}>
            {taskList.map((step, index) => (
              <div key={step.key} role="listitem">
                <StepRow
                  step={step}
                  isComplete={step.done}
                  isActive={index === firstIncompleteIndex}
                  index={index}
                  t={t}
                />
              </div>
            ))}
          </div>

          {!isComplete && (
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={resumeTour} className="w-full gap-2 text-xs">
                <Play className="h-3.5 w-3.5 fill-current" />
                {getOnboardingChecklistShellCopy('resume_tour', t)}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{getOnboardingChecklistShellCopy('need_help', t)}</span>
            {HELP_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:underline"
              >
                <link.icon className="h-3 w-3" />
                {getOnboardingChecklistShellCopy(link.labelKey, t)}
              </a>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
