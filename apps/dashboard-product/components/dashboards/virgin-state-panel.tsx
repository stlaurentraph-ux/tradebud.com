'use client';

import Link from 'next/link';
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

type VirginStep = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

const VIRGIN_STEPS: Record<TenantRole, VirginStep[]> = {
  exporter: [
    {
      title: 'Register producers',
      description: 'Add upstream producers so plots, batches, and shipments stay lineage-safe.',
      href: '/farmers/new',
      ctaLabel: 'Add producer',
    },
    {
      title: 'Map plots',
      description: 'Capture or import plot geometry before you assemble shipment packages.',
      href: '/plots',
      ctaLabel: 'Open plots',
    },
    {
      title: 'Record lots & batches',
      description: 'Log harvest weights so yield plausibility checks can run before sealing.',
      href: '/harvests/new',
      ctaLabel: 'Add batch',
    },
    {
      title: 'Create your first shipment',
      description: 'Assemble lines, run readiness checks, and seal for importer handoff.',
      href: '/packages/new',
      ctaLabel: 'Create shipment',
    },
  ],
  importer: [
    {
      title: 'Build your network',
      description: 'Add exporter and partner contacts so campaigns route to the right teams.',
      href: '/contacts/add?mode=contact',
      ctaLabel: 'Add contact',
    },
    {
      title: 'Launch a campaign',
      description: 'Request missing upstream evidence and references before you declare.',
      href: '/outreach?new=1',
      ctaLabel: 'Launch campaign',
    },
    {
      title: 'Review shared shipments',
      description: 'Open shipments shared with your organisation and check declaration readiness.',
      href: '/packages',
      ctaLabel: 'View shared shipments',
    },
  ],
  cooperative: [
    {
      title: 'Add members',
      description: 'Register cooperative members and capture consent before field capture begins.',
      href: '/contacts/add?mode=contact',
      ctaLabel: 'Add member',
    },
    {
      title: 'Register plots',
      description: 'Start plot registration and geometry verification for member land.',
      href: '/plots',
      ctaLabel: 'Open plots',
    },
    {
      title: 'Launch a field campaign',
      description: 'Collect missing geometry, evidence, and harvest data from members.',
      href: '/outreach?new=1',
      ctaLabel: 'Launch campaign',
    },
  ],
  country_reviewer: [
    {
      title: 'Open the compliance queue',
      description: 'Review flagged packages and evidence submitted for your jurisdiction.',
      href: '/compliance/queue',
      ctaLabel: 'Open queue',
    },
    {
      title: 'Inspect DDS packages',
      description: 'Search packages by exporter, commodity, and compliance status.',
      href: '/packages',
      ctaLabel: 'Browse packages',
    },
    {
      title: 'Resolve role decisions',
      description: 'Clear manual classification holds before downstream submission.',
      href: '/role-decisions',
      ctaLabel: 'Open role decisions',
    },
  ],
  sponsor: [
    {
      title: 'Invite & classify contacts',
      description: 'Add cooperatives, exporters, importers, and producers — tag each contact by supply chain role and country.',
      href: '/contacts/add?mode=contact',
      ctaLabel: 'Invite contact',
    },
    {
      title: 'Register governed organisations',
      description: 'Map organisations across countries and commodities under your sponsor programme.',
      href: '/organisations',
      ctaLabel: 'Add organisation',
    },
    {
      title: 'Launch a transparency programme',
      description: 'Run sponsor-funded programmes to collect EUDR evidence and sustainable market readiness data.',
      href: '/programmes?new=1',
      ctaLabel: 'Launch programme',
    },
    {
      title: 'Review compliance by market',
      description: 'Baseline transparency, deforestation-risk signals, and escalation hotspots before interventions.',
      href: '/compliance-health',
      ctaLabel: 'Open compliance health',
    },
  ],
};

const ROLE_HEADINGS: Record<TenantRole, { title: string; description: string }> = {
  exporter: {
    title: 'Set up your export workspace',
    description: 'Complete these steps to move from empty workspace to your first seal-ready shipment.',
  },
  importer: {
    title: 'Start collecting upstream evidence',
    description: 'Build your network, request missing data, then validate shared shipments for declaration.',
  },
  cooperative: {
    title: 'Onboard your cooperative',
    description: 'Register members and plots, then launch field campaigns to close data gaps.',
  },
  country_reviewer: {
    title: 'Open your review workspace',
    description: 'No submissions are in queue yet. Use these entry points when packages arrive.',
  },
  sponsor: {
    title: 'Build your sponsor oversight network',
    description: 'Invite supply chain contacts, classify them by role, and track transparency across countries and commodities.',
  },
};

interface VirginStatePanelProps {
  role: TenantRole;
  progress?: VirginProgressSignals;
}

export function VirginStatePanel({ role, progress = {} }: VirginStatePanelProps) {
  const heading = ROLE_HEADINGS[role];
  const steps = VIRGIN_STEPS[role];
  const onboardingFlags = readVirginOnboardingFlags();
  const completedSteps = countCompletedVirginSteps(role, { ...progress, ...onboardingFlags });
  const totalSteps = getVirginStepCount(role);
  const activeStepIndex = Math.min(completedSteps, totalSteps - 1);

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-emerald-950">{heading.title}</CardTitle>
            <CardDescription className="mt-1 text-emerald-800/80">{heading.description}</CardDescription>
            <p className="mt-2 text-xs font-medium text-emerald-800">
              Step {Math.min(completedSteps + 1, totalSteps)} of {totalSteps}
              {completedSteps > 0 ? ` · ${completedSteps} completed` : ''}
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
              key={step.title}
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
                      Unlocks after step {index}
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
                <span className="text-xs font-medium text-emerald-700">Completed</span>
              ) : null}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Focus on one step at a time. Metrics and pipeline views appear once you create your first records.
        </p>
      </CardContent>
    </Card>
  );
}
