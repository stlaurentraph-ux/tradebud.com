'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Timeline, type TimelineEvent } from '@/components/ui/timeline-row';
import { useDashboardActivity } from '@/lib/use-dashboard-activity';

interface DashboardActivityCardProps {
  title?: string;
  description?: string;
  emptyMessage: string;
  isVirginTenant?: boolean;
  fallbackEvents?: TimelineEvent[];
  maxHeight?: number;
}

export function DashboardActivityCard({
  title = 'Recent activity',
  description = 'Latest actions and system events',
  emptyMessage,
  isVirginTenant = false,
  fallbackEvents = [],
  maxHeight = 250,
}: DashboardActivityCardProps) {
  const { events: liveActivity, loaded } = useDashboardActivity();
  const events = useMemo(
    () => (liveActivity.length > 0 ? liveActivity : fallbackEvents),
    [liveActivity, fallbackEvents],
  );
  const showEmpty = isVirginTenant || (loaded && events.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showEmpty ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <Timeline events={events} maxHeight={maxHeight} compact />
        )}
      </CardContent>
    </Card>
  );
}
