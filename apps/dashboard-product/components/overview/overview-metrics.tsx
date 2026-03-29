'use client';

import { Package, MapPin, Users, ShieldCheck, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardMetrics } from '@/types';

interface OverviewMetricsProps {
  metrics: DashboardMetrics;
}

const metricCards = [
  {
    key: 'total_packages',
    label: 'Total Packages',
    icon: Package,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'total_plots',
    label: 'Registered Plots',
    icon: MapPin,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    key: 'total_farmers',
    label: 'Active Farmers',
    icon: Users,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    key: 'pending_compliance',
    label: 'Pending Compliance',
    icon: ShieldCheck,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
  {
    key: 'traces_submitted',
    label: 'TRACES Submitted',
    icon: Send,
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
  },
  {
    key: 'compliance_rate',
    label: 'Compliance Rate',
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    suffix: '%',
  },
] as const;

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {metricCards.map((card) => {
        const value = metrics[card.key as keyof DashboardMetrics];
        const displayValue = typeof value === 'number' ? value : 0;

        return (
          <Card key={card.key} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    {displayValue}
                    {card.suffix || ''}
                  </span>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
