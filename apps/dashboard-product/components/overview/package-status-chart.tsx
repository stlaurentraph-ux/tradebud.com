'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShipmentStatus } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import { getShipmentStatusLabel } from '@/lib/status-labels';

interface PackageStatusChartProps {
  packagesByStatus: Record<ShipmentStatus, number>;
}

const statusColors: Record<ShipmentStatus, { color: string; bgColor: string }> = {
  DRAFT: { color: 'bg-muted-foreground', bgColor: 'bg-muted-foreground/20' },
  READY: { color: 'bg-chart-2', bgColor: 'bg-chart-2/20' },
  SEALED: { color: 'bg-primary', bgColor: 'bg-primary/20' },
  SUBMITTED: { color: 'bg-chart-5', bgColor: 'bg-chart-5/20' },
  ACCEPTED: { color: 'bg-primary', bgColor: 'bg-primary/20' },
  REJECTED: { color: 'bg-destructive', bgColor: 'bg-destructive/20' },
  ARCHIVED: { color: 'bg-muted-foreground', bgColor: 'bg-muted-foreground/20' },
  ON_HOLD: { color: 'bg-chart-3', bgColor: 'bg-chart-3/20' },
};

export function PackageStatusChart({ packagesByStatus }: PackageStatusChartProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const role = user?.active_role;
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
            const shipmentStatus = status as ShipmentStatus;
            const colors = statusColors[shipmentStatus];
            const label = getShipmentStatusLabel(shipmentStatus, role, t);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={status}
                className={`${colors.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
                title={`${label}: ${count}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {activeStatuses.map(([status, count]) => {
            const shipmentStatus = status as ShipmentStatus;
            const colors = statusColors[shipmentStatus];
            const label = getShipmentStatusLabel(shipmentStatus, role, t);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${colors.color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
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
