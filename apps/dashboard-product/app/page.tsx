'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { ExporterDashboard } from '@/components/dashboards/exporter-dashboard';
import { ImporterDashboard } from '@/components/dashboards/importer-dashboard';
import { CooperativeDashboard } from '@/components/dashboards/cooperative-dashboard';
import { ReviewerDashboard } from '@/components/dashboards/reviewer-dashboard';
import { SponsorDashboard } from '@/components/dashboards/sponsor-dashboard';
import { WelcomeCard } from '@/components/onboarding/welcome-card';
import { getGatedEntryContext, getGatedEntrySessionKey } from '@/lib/gated-entry-analytics';
import { mockDashboardMetrics } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getRoleDisplayName } from '@/lib/rbac';

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Welcome state: shown after signup redirect (?welcome=1)
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return false;
    return searchParams.get('welcome') === '1';
  });

  // Strip the welcome param from the URL after first render without a hard reload
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      const next = new URL(window.location.href);
      next.searchParams.delete('welcome');
      next.searchParams.delete('entry');
      router.replace(next.pathname + (next.search ? next.search : ''), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const context = getGatedEntryContext(
      searchParams.get('feature'),
      searchParams.get('gate'),
    );
    if (!context || !user) return;

    const sessionKey = getGatedEntrySessionKey(context);
    if (window.sessionStorage.getItem(sessionKey)) return;
    window.sessionStorage.setItem(sessionKey, '1');
    const token = window.sessionStorage.getItem('tracebud_token');

    void fetch('/api/analytics/gated-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        feature: context.feature,
        gate: context.gate,
        tenantId: user.tenant_id,
        role: user.active_role,
        redirectedPath: '/',
      }),
    }).catch(() => {
      // Analytics failures should not block dashboard rendering.
    });
  }, [searchParams, user]);

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
      case 'sponsor':
        return <SponsorDashboard metrics={metrics} />;
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
      case 'sponsor':
        return 'Monitor your sponsored producer network';
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

      <div className="flex-1 p-6 space-y-6">
        {showWelcome && (
          <WelcomeCard
            userName={user?.name}
            onDismiss={() => setShowWelcome(false)}
          />
        )}
        {renderDashboard()}
      </div>
    </div>
  );
}
