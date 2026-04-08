'use client';

import Link from 'next/link';
import { Package, MapPin, Upload, ShieldCheck, Send, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Activity, ActivityType } from '@/types';

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons: Record<ActivityType, typeof Package> = {
  package_created: Plus,
  package_updated: Package,
  package_submitted: Send,
  plot_added: MapPin,
  compliance_check: ShieldCheck,
  document_uploaded: Upload,
  traces_submission: Send,
};

const activityColors: Record<ActivityType, string> = {
  package_created: 'bg-primary/10 text-primary',
  package_updated: 'bg-chart-2/10 text-chart-2',
  package_submitted: 'bg-chart-5/10 text-chart-5',
  plot_added: 'bg-chart-3/10 text-chart-3',
  compliance_check: 'bg-chart-4/10 text-chart-4',
  document_uploaded: 'bg-chart-2/10 text-chart-2',
  traces_submission: 'bg-primary/10 text-primary',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/activity">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => {
            const Icon = activityIcons[activity.type] || Package;
            const colorClass = activityColors[activity.type] || 'bg-muted text-muted-foreground';

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.user_name}</span>
                    <span className="text-border">-</span>
                    <span>{formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
