'use client';

import { AppHeader } from '@/components/layout/app-header';
import { OverviewMetrics } from '@/components/overview/overview-metrics';
import { PackageStatusChart } from '@/components/overview/package-status-chart';
import { ActivityFeed } from '@/components/overview/activity-feed';
import { QuickActions } from '@/components/overview/quick-actions';
import { RecentPackages } from '@/components/overview/recent-packages';
import { mockDashboardMetrics, mockPackages } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getRoleDisplayName } from '@/lib/rbac';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Dashboard Overview"
        subtitle={user ? `Welcome back, ${user.name} - ${getRoleDisplayName(user.active_role)}` : 'Welcome to Tracebud'}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Metrics Row */}
        <OverviewMetrics metrics={mockDashboardMetrics} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Package Status & Activity */}
          <div className="space-y-6 lg:col-span-2">
            <PackageStatusChart packagesByStatus={mockDashboardMetrics.packages_by_status} />
            <RecentPackages packages={mockPackages} />
          </div>

          {/* Right Column - Quick Actions & Activity Feed */}
          <div className="space-y-6">
            <QuickActions />
            <ActivityFeed activities={mockDashboardMetrics.recent_activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
