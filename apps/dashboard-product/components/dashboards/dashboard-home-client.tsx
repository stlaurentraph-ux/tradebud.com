'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { WelcomeCard } from '@/components/onboarding/welcome-card';
import { OnboardingChecklistCard } from '@/components/onboarding/onboarding-checklist-card';
import { ExporterDashboard } from '@/components/dashboards/exporter-dashboard';
import { ImporterDashboard } from '@/components/dashboards/importer-dashboard';
import { CooperativeDashboard } from '@/components/dashboards/cooperative-dashboard';
import { ReviewerDashboard } from '@/components/dashboards/reviewer-dashboard';
import { SponsorDashboard } from '@/components/dashboards/sponsor-dashboard';
import { DashboardAttentionStrip } from '@/components/dashboards/dashboard-attention-strip';
import { DashboardSkeleton } from '@/components/dashboards/dashboard-skeleton';
import { getGatedEntryContext, getGatedEntrySessionKey } from '@/lib/gated-entry-analytics';
import { useAuth } from '@/lib/auth-context';
import {
  acknowledgeWelcome,
  isWelcomeAcknowledged,
} from '@/lib/onboarding-persistence';
import { resolveHarvestPackageScope } from '@/lib/harvest-package-scope';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { useDashboardSummary } from '@/lib/use-dashboard-summary';
import { useDemoData } from '@/lib/demo-data-context';
import { buildDashboardAttentionItems } from '@/lib/dashboard-attention';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import type { DashboardSummaryPayload } from '@/lib/load-dashboard-summary';
import type { LaunchState } from '@/lib/load-launch-state';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardSubtitle } from '@/lib/workflow-terminology-labels';
import type { TimelineEvent } from '@/components/ui/timeline-row';
import type { ShipmentStatus } from '@/types';

const VIRGIN_DASHBOARD_METRICS: {
  total_packages: number;
  packages_by_status: Record<ShipmentStatus, number>;
  total_plots: number;
  compliant_plots: number;
  total_farmers: number;
  incoming_requests_pending: number;
  outgoing_requests_pending: number;
  blocking_issues_count: number;
  yield_failures_count: number;
  upstream_blockers_count: number;
  owned_blocking_issues_count: number;
  recent_activity: TimelineEvent[];
} = {
  total_packages: 0,
  packages_by_status: {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
  incoming_requests_pending: 0,
  outgoing_requests_pending: 0,
  blocking_issues_count: 0,
  yield_failures_count: 0,
  upstream_blockers_count: 0,
  owned_blocking_issues_count: 0,
  recent_activity: [],
};

interface DashboardHomeClientProps {
  initialSummary?: DashboardSummaryPayload | null;
  initialLaunchState?: LaunchState | null;
}

export function DashboardHomeClient({
  initialSummary = null,
  initialLaunchState = null,
}: DashboardHomeClientProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { demoDataEnabled } = useDemoData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trialState, setTrialState] = useState<LaunchState | null>(initialLaunchState);
  const [welcomeAcknowledged, setWelcomeAcknowledged] = useState(false);

  const userRole = user?.active_role;
  const userTenantId = user?.tenant_id;
  const userId = user?.id;
  const isWelcomeEntry = searchParams.get('welcome') === '1' && !welcomeAcknowledged;

  useEffect(() => {
    if (!userId) {
      setWelcomeAcknowledged(false);
      return;
    }
    setWelcomeAcknowledged(isWelcomeAcknowledged(userId));
  }, [userId]);

  const markWelcomeAcknowledged = () => {
    if (!userId) return;
    acknowledgeWelcome(userId);
    setWelcomeAcknowledged(true);
  };
  const packageScope = resolveHarvestPackageScope(user?.active_role);
  const summaryEnabled = Boolean(userTenantId) && !demoDataEnabled;
  const {
    metrics: summaryMetrics,
    packages: summaryPackages,
    campaigns: summaryCampaigns,
    sponsor: summarySponsor,
    isLoading: summaryLoading,
    error: summaryError,
  } = useDashboardSummary(summaryEnabled, { packageScope, initialSummary });
  const { packages: demoPackages, isLoading: demoPackagesLoading, error: demoPackagesError } = useHarvestPackages(
    userTenantId ?? null,
    {
      scope: packageScope,
      enabled: Boolean(userTenantId) && demoDataEnabled,
    },
  );
  const homePackages = demoDataEnabled ? demoPackages : summaryPackages;
  const homePackagesLoading = demoDataEnabled ? demoPackagesLoading : summaryLoading;
  const homePackagesError = demoDataEnabled ? demoPackagesError : summaryError;

  const baseDashboardMetrics = useMemo(() => {
    const packageCounts: Record<ShipmentStatus, number> = {
      DRAFT: 0,
      READY: 0,
      SEALED: 0,
      SUBMITTED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
      ON_HOLD: 0,
    };

    const producerIds = new Set<string>();
    const plotIds = new Set<string>();
    let compliantPlots = 0;
    let blockingIssues = 0;
    let yieldFailures = 0;

    for (const pkg of homePackages) {
      packageCounts[pkg.status] = (packageCounts[pkg.status] ?? 0) + 1;
      if (pkg.compliance_status === 'BLOCKED') blockingIssues += 1;
      if (pkg.compliance_status === 'WARNINGS') yieldFailures += 1;

      for (const farmer of pkg.farmers ?? []) {
        producerIds.add(farmer.id);
      }
      for (const plot of pkg.plots ?? []) {
        plotIds.add(plot.id);
        if (plot.verified) compliantPlots += 1;
      }
    }

    const recentActivity: TimelineEvent[] = homePackages
      .slice()
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 8)
      .map((pkg) => ({
        id: pkg.id,
        eventType: 'status_change',
        timestamp: pkg.updated_at,
        userName: 'System',
        description: `Shipment ${pkg.code} moved to ${pkg.status}`,
        metadata: {
          compliance: pkg.compliance_status,
        },
      }));

    return {
      total_packages: homePackages.length,
      packages_by_status: packageCounts,
      total_plots: plotIds.size,
      compliant_plots: compliantPlots,
      total_farmers: producerIds.size,
      incoming_requests_pending: 0,
      outgoing_requests_pending: 0,
      blocking_issues_count: blockingIssues,
      yield_failures_count: yieldFailures,
      upstream_blockers_count: 0,
      owned_blocking_issues_count: 0,
      recent_activity: recentActivity,
    };
  }, [homePackages]);

  const dashboardMetrics = useMemo(() => {
    if (!demoDataEnabled && summaryMetrics) {
      return summaryMetrics;
    }
    return baseDashboardMetrics;
  }, [baseDashboardMetrics, demoDataEnabled, summaryMetrics]);

  const homeResources = useMemo<DashboardHomeResources | undefined>(() => {
    if (!userTenantId) return undefined;
    if (demoDataEnabled) {
      return {
        packages: homePackages,
        packagesLoading: homePackagesLoading,
        packagesError: homePackagesError,
        activityEvents: baseDashboardMetrics.recent_activity,
        activityLoaded: !homePackagesLoading,
      };
    }
    return {
      packages: summaryPackages,
      packagesLoading: summaryLoading,
      packagesError: summaryError,
      campaigns: summaryCampaigns,
      campaignsLoading: summaryLoading,
      activityEvents: summaryMetrics?.recent_activity ?? [],
      activityLoaded: !summaryLoading,
      sponsorSummary: summarySponsor ?? undefined,
    };
  }, [
    userTenantId,
    demoDataEnabled,
    homePackages,
    homePackagesLoading,
    homePackagesError,
    baseDashboardMetrics.recent_activity,
    summaryPackages,
    summaryCampaigns,
    summaryLoading,
    summaryError,
    summaryMetrics?.recent_activity,
    summarySponsor,
  ]);

  const showDashboardSkeleton = summaryEnabled && summaryLoading && !summaryMetrics;

  useEffect(() => {
    const context = getGatedEntryContext(
      searchParams.get('feature'),
      searchParams.get('gate'),
    );
    if (!context || !user || !userTenantId || !userRole) return;

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
        role: userRole,
        redirectedPath: '/',
      }),
    }).catch(() => {
      // Analytics failures should not block dashboard rendering.
    });
  }, [searchParams, user, userTenantId, userRole]);

  useEffect(() => {
    if (!userId || initialLaunchState) return;
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/launch/state', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.lifecycle_status) {
          setTrialState({
            lifecycle_status: payload.lifecycle_status,
            trial_expires_at: payload.trial_expires_at ?? null,
          });
        }
      })
      .catch(() => undefined);
  }, [userId, initialLaunchState]);

  const attentionItems = useMemo(
    () =>
      buildDashboardAttentionItems({
        t,
        role: userRole,
        ownedBlockingIssuesCount: dashboardMetrics?.owned_blocking_issues_count ?? dashboardMetrics?.blocking_issues_count,
        upstreamBlockersCount: dashboardMetrics?.upstream_blockers_count,
        yieldFailuresCount: dashboardMetrics?.yield_failures_count,
        trialLifecycleStatus: trialState?.lifecycle_status ?? null,
        trialExpiresAt: trialState?.trial_expires_at ?? null,
        summaryError: summaryError && !demoDataEnabled ? summaryError : null,
        onboardingStep: null,
      }),
    [
      t,
      userRole,
      dashboardMetrics?.owned_blocking_issues_count,
      dashboardMetrics?.blocking_issues_count,
      dashboardMetrics?.upstream_blockers_count,
      dashboardMetrics?.yield_failures_count,
      trialState?.lifecycle_status,
      trialState?.trial_expires_at,
      summaryError,
      demoDataEnabled,
    ],
  );

  const renderDashboard = () => {
    if (!user) return null;

    const metrics = dashboardMetrics ?? VIRGIN_DASHBOARD_METRICS;

    switch (user.active_role) {
      case 'exporter':
        return <ExporterDashboard metrics={metrics} packages={homePackages} home={homeResources} />;
      case 'importer':
        return <ImporterDashboard metrics={metrics} home={homeResources} />;
      case 'cooperative':
        return <CooperativeDashboard metrics={metrics} home={homeResources} />;
      case 'country_reviewer':
        return <ReviewerDashboard metrics={metrics} home={homeResources} />;
      case 'sponsor':
        return <SponsorDashboard metrics={metrics} home={homeResources} />;
      default:
        return <ExporterDashboard metrics={metrics} packages={homePackages} home={homeResources} />;
    }
  };

  const subtitle = user ? getDashboardSubtitle(user.active_role, t) : getDashboardSubtitle(undefined, t);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={user ? `Welcome, ${user.name}` : 'Dashboard'}
        subtitle={subtitle}
      />

      <div className="flex-1 p-6">
        {isWelcomeEntry ? (
          <div className="mb-6">
            <WelcomeCard
              userName={user?.name}
              onDismiss={() => {
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.delete('welcome');
                nextParams.delete('entry');
                const nextQuery = nextParams.toString();
                markWelcomeAcknowledged();
                router.replace(nextQuery ? `/?${nextQuery}` : '/');
              }}
              onStartOnboarding={() => {
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.delete('welcome');
                nextParams.delete('entry');
                const nextQuery = nextParams.toString();
                markWelcomeAcknowledged();
                router.replace(nextQuery ? `/?${nextQuery}` : '/');
              }}
              onExploreWorkspace={() => {
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.delete('welcome');
                nextParams.delete('entry');
                const nextQuery = nextParams.toString();
                markWelcomeAcknowledged();
                router.replace(nextQuery ? `/?${nextQuery}` : '/');
              }}
            />
          </div>
        ) : null}
        {showDashboardSkeleton ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardAttentionStrip items={attentionItems} role={user?.active_role} t={t} />
            <div className="mb-6">
              <OnboardingChecklistCard />
            </div>
            {renderDashboard()}
          </>
        )}
      </div>
    </div>
  );
}
