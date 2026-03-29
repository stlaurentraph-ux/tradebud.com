'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PackageStatus } from '@/types';

interface PackageStatusChartProps {
  packagesByStatus: Record<PackageStatus, number>;
}

const statusConfig: Record<PackageStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'bg-muted-foreground', bgColor: 'bg-muted-foreground/20' },
  in_review: { label: 'In Review', color: 'bg-chart-2', bgColor: 'bg-chart-2/20' },
  preflight_check: { label: 'Pre-flight', color: 'bg-chart-3', bgColor: 'bg-chart-3/20' },
  traces_ready: { label: 'TRACES Ready', color: 'bg-primary', bgColor: 'bg-primary/20' },
  submitted: { label: 'Submitted', color: 'bg-chart-5', bgColor: 'bg-chart-5/20' },
  approved: { label: 'Approved', color: 'bg-primary', bgColor: 'bg-primary/20' },
  rejected: { label: 'Rejected', color: 'bg-destructive', bgColor: 'bg-destructive/20' },
};

export function PackageStatusChart({ packagesByStatus }: PackageStatusChartProps) {
  const total = Object.values(packagesByStatus).reduce((sum, count) => sum + count, 0);
  const activeStatuses = Object.entries(packagesByStatus).filter(([, count]) => count > 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Package Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual bar */}
        <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-secondary">
          {activeStatuses.map(([status, count]) => {
            const config = statusConfig[status as PackageStatus];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={status}
                className={`${config.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
                title={`${config.label}: ${count}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {activeStatuses.map(([status, count]) => {
            const config = statusConfig[status as PackageStatus];
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
                <span className="ml-auto text-xs font-medium text-foreground">
                  {count} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
