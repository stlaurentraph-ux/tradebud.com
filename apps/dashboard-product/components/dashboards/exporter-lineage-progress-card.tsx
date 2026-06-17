'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildExporterLineageSteps,
  countExporterLineageCompletedSteps,
  type ExporterLineageStepState,
} from '@/lib/exporter-lineage-progress';
import type { VirginProgressSignals } from '@/lib/virgin-state-progress';
import { readVirginOnboardingFlags } from '@/lib/virgin-state-progress';
import {
  getExporterLineageCardCopy,
  getExporterLineageStepCopy,
} from '@/lib/exporter-lineage-copy';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

interface ExporterLineageProgressCardProps {
  signals: VirginProgressSignals;
  t?: (key: string) => string;
}

function LineageStepRow({
  step,
  t,
}: {
  step: ExporterLineageStepState;
  t?: (key: string) => string;
}) {
  const title = getExporterLineageStepCopy(step.id, 'title', t);
  const description = getExporterLineageStepCopy(step.id, 'description', t);
  const ctaLabel = getExporterLineageStepCopy(step.id, 'ctaLabel', t);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
        step.completed ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start gap-3">
        {step.completed ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {!step.completed ? (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link
            href={step.href}
            onClick={() => {
              trackDashboardEvent(DASHBOARD_EVENTS.EXPORTER_LINEAGE_STEP_CLICKED, {
                step_id: step.id,
              });
            }}
          >
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ExporterLineageProgressCard({ signals, t }: ExporterLineageProgressCardProps) {
  const onboardingFlags = readVirginOnboardingFlags();
  const steps = buildExporterLineageSteps({ ...signals, ...onboardingFlags });
  const completed = countExporterLineageCompletedSteps(steps);
  const total = steps.length;

  if (completed >= total) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getExporterLineageCardCopy('title', t)}</CardTitle>
        <CardDescription>
          {getExporterLineageCardCopy('description', t)}{' '}
          <span className="font-medium text-foreground">
            {getExporterLineageCardCopy('progress', t, { completed, total })}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <LineageStepRow key={step.id} step={step} t={t} />
        ))}
      </CardContent>
    </Card>
  );
}
