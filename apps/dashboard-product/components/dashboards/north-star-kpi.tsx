'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NorthStarConfig } from '@/lib/dashboard-north-star';

const TONE_STYLES: Record<NorthStarConfig['tone'], string> = {
  emerald: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950',
  blue: 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-950',
  teal: 'border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-950',
  purple: 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-950',
  cyan: 'border-cyan-200 bg-gradient-to-r from-cyan-50 to-emerald-50 text-cyan-950',
};

interface NorthStarKpiProps {
  config: NorthStarConfig;
  priorityLabel?: string;
}

export function NorthStarKpi({ config, priorityLabel = 'Your priority' }: NorthStarKpiProps) {
  return (
    <Card className={cn('border', TONE_STYLES[config.tone])}>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{priorityLabel}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums">{config.value}</span>
            <span className="text-lg font-semibold">{config.label}</span>
          </div>
          <p className="max-w-2xl text-sm opacity-80">{config.hint}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={config.ctaHref}>
            {config.ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
