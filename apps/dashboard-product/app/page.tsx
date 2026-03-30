'use client';

import { AppHeader } from '@/components/layout/app-header';
import { ExporterDashboard } from '@/components/dashboards/exporter-dashboard';
import { ImporterDashboard } from '@/components/dashboards/importer-dashboard';
import { CooperativeDashboard } from '@/components/dashboards/cooperative-dashboard';
import { ReviewerDashboard } from '@/components/dashboards/reviewer-dashboard';
import { mockDashboardMetrics } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getRoleDisplayName } from '@/lib/rbac';

export default function DashboardPage() {
  const { user } = useAuth();

  // Determine which dashboard to show based on user role
  const renderDashboard = () => {
    if (!user) return null;

    const metrics = {
      total_packages: mockDashboardMetrics.total_packages,
      packages_by_status: mockDashboardMetrics.packages_by_status,
      total_plots: mockDashboardMetrics.total_plots,
      compliant_plots: mockDashboardMetrics.compliant_plots,
      total_farmers: mockDashboardMetrics.total_farmers,
    };

    switch (user.active_role) {
      case 'exporter':
        return <ExporterDashboard metrics={metrics} />;
      case 'importer':
        return <ImporterDashboard metrics={metrics} />;
      case 'cooperative':
        return <CooperativeDashboard metrics={metrics} />;
      case 'country_reviewer':
        return <ReviewerDashboard metrics={metrics} />;
      default:
        return <ExporterDashboard metrics={metrics} />;
    }
  };

  // Get role-specific subtitle
  const getSubtitle = () => {
    if (!user) return 'Welcome to Tracebud';
    
    switch (user.active_role) {
      case 'exporter':
        return 'Manage DDS packages and TRACES submissions';
      case 'importer':
        return 'Monitor supply chain compliance status';
      case 'cooperative':
        return 'Manage farmers and plot registrations';
      case 'country_reviewer':
        return 'Review and verify compliance submissions';
      default:
        return `${getRoleDisplayName(user.active_role)} Dashboard`;
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={user ? `Welcome, ${user.name}` : 'Dashboard'}
        subtitle={getSubtitle()}
      />

      <div className="flex-1 p-6">
        {renderDashboard()}
      </div>
    </div>
  );
}
