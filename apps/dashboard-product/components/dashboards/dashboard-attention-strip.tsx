'use client';

import Link from 'next/link';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AttentionItem, AttentionSeverity } from '@/lib/dashboard-attention';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

interface DashboardAttentionStripProps {
  items: AttentionItem[];
  role?: string;
}

const SEVERITY_STYLES: Record<
  AttentionSeverity,
  { container: string; icon: string; badge: string }
> = {
  blocking: {
    container: 'border-red-300 bg-red-50',
    icon: 'text-red-700',
    badge: 'bg-red-200 text-red-900',
  },
  warning: {
    container: 'border-amber-300 bg-amber-50',
    icon: 'text-amber-700',
    badge: 'bg-amber-200 text-amber-900',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-700',
    badge: 'bg-blue-200 text-blue-900',
  },
};

function SeverityIcon({ severity }: { severity: AttentionSeverity }) {
  const className = SEVERITY_STYLES[severity].icon;
  if (severity === 'blocking') {
    return <AlertOctagon className={cn('h-4 w-4 shrink-0', className)} aria-hidden="true" />;
  }
  if (severity === 'warning') {
    return <AlertTriangle className={cn('h-4 w-4 shrink-0', className)} aria-hidden="true" />;
  }
  return <Info className={cn('h-4 w-4 shrink-0', className)} aria-hidden="true" />;
}

export function DashboardAttentionStrip({ items, role }: DashboardAttentionStripProps) {
  if (items.length === 0) {
    return null;
  }

  const [primary, ...secondary] = items;

  return (
    <div className="mb-4 space-y-2" role="region" aria-label="Attention required">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
          SEVERITY_STYLES[primary.severity].container,
        )}
      >
        <div className="flex items-start gap-3">
          <SeverityIcon severity={primary.severity} />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  SEVERITY_STYLES[primary.severity].badge,
                )}
              >
                {primary.severity}
              </span>
              <p className="font-semibold">{primary.title}</p>
            </div>
            <p className="text-sm opacity-90">{primary.message}</p>
          </div>
        </div>
        {primary.ctaLabel && primary.ctaHref ? (
          <Button asChild size="sm" variant="outline" className="shrink-0 bg-white/80">
            <Link
              href={primary.ctaHref}
              onClick={() => {
                if (primary.id === 'upstream-blockers') {
                  trackDashboardEvent(DASHBOARD_EVENTS.UPSTREAM_BLOCKER_ALERT_CLICKED, {
                    count: undefined,
                    role,
                  });
                }
              }}
            >
              {primary.ctaLabel}
            </Link>
          </Button>
        ) : null}
      </div>

      {secondary.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {secondary.map((item) => (
            <div
              key={item.id}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
                SEVERITY_STYLES[item.severity].container,
              )}
            >
              <SeverityIcon severity={item.severity} />
              <span className="font-medium">{item.title}</span>
              {item.ctaHref ? (
                <Link href={item.ctaHref} className="underline underline-offset-2">
                  {item.ctaLabel ?? 'Open'}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
