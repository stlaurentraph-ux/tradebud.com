"use client";

import { Package, MapPin, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  subtitle,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              {change && (
                <span
                  className={`flex items-center text-xs font-medium ${
                    changeType === "positive"
                      ? "text-green-500"
                      : changeType === "negative"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {changeType === "positive" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : changeType === "negative" ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {change}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsCardsProps {
  metrics?: {
    totalPackages: number;
    pendingPackages: number;
    totalPlots: number;
    totalFarmers: number;
  };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const defaultMetrics = {
    totalPackages: 0,
    pendingPackages: 0,
    totalPlots: 0,
    totalFarmers: 0,
  };

  const data = metrics || defaultMetrics;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Shipment Packages"
        value={data.totalPackages.toLocaleString()}
        change="+12.5%"
        changeType="positive"
        subtitle="vs last month"
        icon={<Package className="h-5 w-5" />}
      />
      <MetricCard
        title="Pending Submission"
        value={data.pendingPackages.toLocaleString()}
        change={data.pendingPackages > 0 ? "Requires action" : "All clear"}
        changeType={data.pendingPackages > 0 ? "negative" : "positive"}
        subtitle="Awaiting downstream handoff"
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <MetricCard
        title="Registered Plots"
        value={data.totalPlots.toLocaleString()}
        change="+8.2%"
        changeType="positive"
        subtitle="Verified locations"
        icon={<MapPin className="h-5 w-5" />}
      />
      <MetricCard
        title="Active Producers"
        value={data.totalFarmers.toLocaleString()}
        change="+5.1%"
        changeType="positive"
        subtitle="In your network"
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  );
}
