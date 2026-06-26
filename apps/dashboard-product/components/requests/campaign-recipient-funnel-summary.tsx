'use client';

import { Badge } from '@/components/ui/badge';
import {
  computeCampaignFunnelMetrics,
  type CampaignRecipientStatusCounts,
} from '@/lib/campaign-recipient-timeline';
import {
  getCampaignRecipientFunnelProgressLabel,
  getCampaignRecipientFunnelStatLabel,
  type TranslateFn,
} from '@/lib/workflow-terminology-labels';
import { cn } from '@/lib/utils';

type CampaignRecipientFunnelSummaryProps = {
  counts: CampaignRecipientStatusCounts | undefined;
  totalRecipients: number;
  t?: TranslateFn;
  className?: string;
};

export function CampaignRecipientFunnelSummary({
  counts,
  totalRecipients,
  t,
  className,
}: CampaignRecipientFunnelSummaryProps) {
  const metrics = computeCampaignFunnelMetrics(counts, totalRecipients);
  if (metrics.total === 0) {
    return null;
  }

  const statItems = [
    { key: 'invited' as const, value: metrics.invited },
    { key: 'joined' as const, value: metrics.joined },
    { key: 'responded' as const, value: metrics.responded },
    { key: 'fulfilled' as const, value: metrics.fulfilled },
  ];

  return (
    <div className={cn('space-y-3 rounded-lg border bg-muted/30 p-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {getCampaignRecipientFunnelProgressLabel(t, {
            fulfilled: metrics.fulfilled,
            total: metrics.total,
            percent: metrics.progressPercent,
          })}
        </p>
        <Badge variant="outline" className="text-xs">
          {metrics.progressPercent}%
        </Badge>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={metrics.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={getCampaignRecipientFunnelProgressLabel(t, {
          fulfilled: metrics.fulfilled,
          total: metrics.total,
          percent: metrics.progressPercent,
        })}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${metrics.progressPercent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {statItems.map((item) => (
          <Badge key={item.key} variant="secondary" className="text-xs font-normal">
            {getCampaignRecipientFunnelStatLabel(item.key, t, { count: item.value })}
          </Badge>
        ))}
      </div>
    </div>
  );
}
