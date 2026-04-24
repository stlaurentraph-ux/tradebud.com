'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { ExporterDashboard } from '@/components/dashboards/exporter-dashboard';
import { ImporterDashboard } from '@/components/dashboards/importer-dashboard';
import { CooperativeDashboard } from '@/components/dashboards/cooperative-dashboard';
import { ReviewerDashboard } from '@/components/dashboards/reviewer-dashboard';
import { SponsorDashboard } from '@/components/dashboards/sponsor-dashboard';
import { OnboardingChecklistCard } from '@/components/onboarding/onboarding-checklist-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDeferredGateForPath } from '@/lib/feature-gates';
import { getGatedEntryContext, getGatedEntrySessionKey } from '@/lib/gated-entry-analytics';
import { useAuth } from '@/lib/auth-context';
import { useOnboarding } from '@/lib/onboarding-context';
import { getRoleDisplayName } from '@/lib/rbac';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { useInboxRequests, useRequestCampaigns } from '@/lib/use-requests';
import type { TimelineEvent } from '@/components/ui/timeline-row';
import type { ShipmentStatus, TenantRole } from '@/types';

const ONBOARDING_COPY: Record<string, { title: string; description: string; ctaLabel: string; href: string }> = {
  create_account: {
    title: 'Complete your account setup',
    description: 'Confirm your organization profile so permissions, trial status, and audit logs stay consistent.',
    ctaLabel: 'Open settings',
    href: '/settings',
  },
  create_first_campaign: {
    title: 'Create your first campaign',
    description: 'Campaigns define who can submit records and keep onboarding scoped to your active workflow.',
    ctaLabel: 'Open campaigns',
    href: '/outreach',
  },
  upload_contacts: {
    title: 'Set up your member and partner directory',
    description: 'Add members or partners early so campaigns, evidence collection, and traceability links route correctly.',
    ctaLabel: 'Open directory',
    href: '/contacts',
  },
  invite_field_team: {
    title: 'Invite your field team',
    description: 'Assign collaborators early so capture and review tasks can run in parallel from day one.',
    ctaLabel: 'Open users',
    href: '/admin/users',
  },
  generate_first_insight: {
    title: 'Generate your first insight',
    description: 'Run your first dashboard workflow to validate data quality and establish a baseline.',
    ctaLabel: 'Open dashboard',
    href: '/',
  },
  join_campaign: {
    title: 'Join your first campaign',
    description: 'Joining a campaign links your field activity to the correct compliance process.',
    ctaLabel: 'Open campaigns',
    href: '/outreach',
  },
  capture_first_plot: {
    title: 'Capture your first plot',
    description: 'Create a first plot record to validate geometry and start your submission lineage.',
    ctaLabel: 'Open plots',
    href: '/plots',
  },
  sync_first_submission: {
    title: 'Build your first lot or batch',
    description: 'Create a first aggregation record so yield plausibility checks and lineage lock can begin.',
    ctaLabel: 'Open lots & batches',
    href: '/harvests',
  },
  review_first_submission: {
    title: 'Review your first blocker',
    description: 'Use the issues board to assign and resolve blockers before shipment sealing.',
    ctaLabel: 'Open issues',
    href: '/compliance/issues',
  },
  run_first_compliance_check: {
    title: 'Prepare your first shipment',
    description: 'Open the shipment workspace to assemble package lines and validate readiness before sealing.',
    ctaLabel: 'Open shipments',
    href: '/packages',
  },
};

const IMPORTER_ONBOARDING_COPY_OVERRIDES: Partial<
  Record<string, { title: string; description: string; ctaLabel: string; href: string }>
> = {
  create_first_campaign: {
    title: 'Launch your first campaign',
    description: 'Use campaigns to collect missing upstream evidence and references before declaration submission.',
    ctaLabel: 'Open campaigns',
    href: '/outreach',
  },
  upload_contacts: {
    title: 'Build your network',
    description: 'Add counterpart contacts so campaigns and inbound requests route to the correct teams.',
    ctaLabel: 'Open network',
    href: '/contacts',
  },
  review_first_submission: {
    title: 'Resolve your first issue',
    description: 'Use the issues workspace to resolve declaration blockers and warnings.',
    ctaLabel: 'Open issues',
    href: '/compliance/issues',
  },
  run_first_compliance_check: {
    title: 'Run your first compliance check',
    description: 'Validate shipment readiness, role decisions, and references before DDS submission.',
    ctaLabel: 'Open compliance',
    href: '/compliance',
  },
  generate_first_insight: {
    title: 'Generate your first reporting snapshot',
    description: 'Create a reporting snapshot for operational follow-up and annual obligations.',
    ctaLabel: 'Open reporting',
    href: '/reports',
  },
};

const SPONSOR_ONBOARDING_COPY_OVERRIDES: Partial<
  Record<string, { title: string; description: string; ctaLabel: string; href: string }>
> = {
  create_first_campaign: {
    title: 'Launch your first programme campaign',
    description: 'Use Programmes to send sponsor-scoped bulk requests to upstream organisations.',
    ctaLabel: 'Open programmes',
    href: '/programmes',
  },
  upload_contacts: {
    title: 'Map your organisations',
    description: 'Review governed organisations and sponsor coverage before launching interventions.',
    ctaLabel: 'Open organisations',
    href: '/organisations',
  },
  generate_first_insight: {
    title: 'Generate your first sponsor report',
    description: 'Open reporting to baseline network health, programme outcomes, and governance KPIs.',
    ctaLabel: 'Open reporting',
    href: '/reports',
  },
  run_first_compliance_check: {
    title: 'Review compliance health',
    description: 'Use compliance health to detect cross-network blockers and escalation hotspots.',
    ctaLabel: 'Open compliance health',
    href: '/compliance-health',
  },
  review_first_submission: {
    title: 'Review network issues',
    description: 'Use Issues to triage high-priority exceptions requiring sponsor intervention.',
    ctaLabel: 'Open issues',
    href: '/compliance/issues',
  },
};

const ONBOARDING_STEP_ACTION_KEYS: Record<string, string | null> = {
  create_account: null,
  create_first_campaign: 'campaign_created',
  upload_contacts: 'contacts_uploaded',
  invite_field_team: 'team_invited',
  generate_first_insight: 'insight_generated',
  join_campaign: 'campaign_joined',
  capture_first_plot: 'first_plot_captured',
  sync_first_submission: 'first_submission_synced',
  review_first_submission: 'submission_reviewed',
  run_first_compliance_check: 'compliance_check_run',
};

function getOnboardingActionStorageKey(actionKey: string): string {
  return `tracebud_onboarding_action_${actionKey}`;
}

function getOnboardingCopyForRole(stepKey: string, role?: TenantRole) {
  const isImporterRole = role === 'importer' || role === 'country_reviewer';
  if (isImporterRole && IMPORTER_ONBOARDING_COPY_OVERRIDES[stepKey]) {
    return IMPORTER_ONBOARDING_COPY_OVERRIDES[stepKey]!;
  }
  if (role === 'sponsor' && SPONSOR_ONBOARDING_COPY_OVERRIDES[stepKey]) {
    return SPONSOR_ONBOARDING_COPY_OVERRIDES[stepKey]!;
  }
  return (
    ONBOARDING_COPY[stepKey] ?? {
      title: stepKey.replaceAll('_', ' '),
      description: 'Complete this step to continue your onboarding sequence.',
      ctaLabel: 'Open feature',
      href: '/',
    }
  );
}

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
  recent_activity: [],
};

type CooperativeInsightsResponse = {
  metrics?: Partial<typeof VIRGIN_DASHBOARD_METRICS>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  useOnboarding();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trialState, setTrialState] = useState<{
    lifecycle_status: 'trial_active' | 'trial_expired' | 'paid_active' | 'suspended';
    trial_expires_at: string | null;
  } | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<Array<{ step_key: string; completed: boolean }>>([]);
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false);
  const [isAutoValidatingStep, setIsAutoValidatingStep] = useState(false);
  const [onboardingNavigationNotice, setOnboardingNavigationNotice] = useState<string | null>(null);
  const [welcomeAcknowledged, setWelcomeAcknowledged] = useState(false);
  const [cooperativeInsightsMetrics, setCooperativeInsightsMetrics] = useState<
    Partial<typeof VIRGIN_DASHBOARD_METRICS> | null
  >(null);

  const onboardingRole = useMemo(() => {
    if (!user) return 'admin';
    if (user.active_role === 'cooperative') return 'field_operator';
    if (user.active_role === 'importer' || user.active_role === 'country_reviewer') return 'compliance_manager';
    return 'admin';
  }, [user]);

  const userRole = user?.active_role;
  const userTenantId = user?.tenant_id;
  const userId = user?.id;
  const isWelcomeEntry = searchParams.get('welcome') === '1' && !welcomeAcknowledged;
  const { packages } = useHarvestPackages(userTenantId ?? null);
  const { pendingRequests } = useInboxRequests(userTenantId ?? null);
  const { campaigns } = useRequestCampaigns(userTenantId ?? null);

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

    for (const pkg of packages) {
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

    const recentActivity: TimelineEvent[] = packages
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
      total_packages: packages.length,
      packages_by_status: packageCounts,
      total_plots: plotIds.size,
      compliant_plots: compliantPlots,
      total_farmers: producerIds.size,
      incoming_requests_pending: pendingRequests.length,
      outgoing_requests_pending: campaigns.filter(
        (campaign) => campaign.status === 'DRAFT' || campaign.status === 'QUEUED' || campaign.status === 'RUNNING',
      ).length,
      blocking_issues_count: blockingIssues,
      yield_failures_count: yieldFailures,
      recent_activity: recentActivity,
    };
  }, [packages, pendingRequests, campaigns]);

  useEffect(() => {
    if (!user || user.active_role !== 'cooperative') {
      setCooperativeInsightsMetrics(null);
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/insights', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: CooperativeInsightsResponse) => {
        if (!payload.metrics || Object.keys(payload.metrics).length === 0) return;
        setCooperativeInsightsMetrics(payload.metrics);
      })
      .catch(() => undefined);
  }, [user]);

  const dashboardMetrics = useMemo(
    () =>
      user?.active_role === 'cooperative' && cooperativeInsightsMetrics
        ? { ...baseDashboardMetrics, ...cooperativeInsightsMetrics }
        : baseDashboardMetrics,
    [baseDashboardMetrics, cooperativeInsightsMetrics, user?.active_role],
  );

  const onboardingProgress = useMemo(() => {
    if (onboardingSteps.length === 0) return 0;
    const completed = onboardingSteps.filter((step) => step.completed).length;
    return Math.round((completed / onboardingSteps.length) * 100);
  }, [onboardingSteps]);

  const activeOnboardingStepIndex = useMemo(
    () => onboardingSteps.findIndex((step) => !step.completed),
    [onboardingSteps],
  );

  const activeOnboardingStep =
    activeOnboardingStepIndex >= 0 ? onboardingSteps[activeOnboardingStepIndex] : null;

  const onboardingDismissKey = useMemo(() => {
    if (!userTenantId || !userRole) return null;
    return `tracebud_onboarding_dismissed_${userTenantId}_${userRole}`;
  }, [userTenantId, userRole]);

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
    if (!userId) return;
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
    void fetch(`/api/launch/onboarding?role=${encodeURIComponent(onboardingRole)}`, { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload) && payload.length > 0) {
          setOnboardingSteps(payload);
        }
      })
      .catch(() => undefined);
  }, [userId, onboardingRole]);

  useEffect(() => {
    if (!userId || onboardingSteps.length === 0 || activeOnboardingStepIndex === -1 || !onboardingDismissKey) {
      setIsOnboardingDialogOpen(false);
      return;
    }
    if (isWelcomeEntry) {
      setIsOnboardingDialogOpen(false);
      return;
    }
    const dismissed = window.sessionStorage.getItem(onboardingDismissKey) === '1';
    setIsOnboardingDialogOpen(!dismissed);
  }, [userId, onboardingSteps, activeOnboardingStepIndex, onboardingDismissKey, isWelcomeEntry]);

  const skipOnboardingForNow = () => {
    if (onboardingDismissKey) {
      window.sessionStorage.setItem(onboardingDismissKey, '1');
    }
    setIsOnboardingDialogOpen(false);
  };

  const resumeOnboarding = () => {
    if (!onboardingDismissKey || activeOnboardingStepIndex === -1) return;
    window.sessionStorage.removeItem(onboardingDismissKey);
    setIsOnboardingDialogOpen(true);
  };

  const currentStepCopy = activeOnboardingStep
    ? getOnboardingCopyForRole(activeOnboardingStep.step_key, userRole)
    : null;

  const currentStepNumber = activeOnboardingStepIndex + 1;

  const getOnboardingCopyForStep = (stepKey: string) => getOnboardingCopyForRole(stepKey, userRole);

  const openOnboardingStepFeature = (stepKey: string) => {
    const stepCopy = getOnboardingCopyForStep(stepKey);
    const gate = getDeferredGateForPath(stepCopy.href);
    if (gate) {
      setOnboardingNavigationNotice(
        `This step route is currently gated (${gate}). Redirected to dashboard overview.`,
      );
      if (userTenantId && userRole) {
        const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
        void fetch('/api/analytics/gated-entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            eventType: 'onboarding_cta_gated_redirect',
            feature: 'mvp_gated',
            gate,
            tenantId: userTenantId,
            role: userRole,
            redirectedPath: stepCopy.href,
          }),
        }).catch(() => undefined);
      }
      router.push('/');
      return;
    }
    setOnboardingNavigationNotice(null);
    router.push(stepCopy.href);
    setIsOnboardingDialogOpen(false);
  };

  const goToCurrentStepFeature = () => {
    if (!activeOnboardingStep) return;
    openOnboardingStepFeature(activeOnboardingStep.step_key);
  };

  const isStepActionValidated = (stepKey: string): boolean => {
    if (stepKey === 'create_account') {
      return Boolean(userId);
    }
    const actionKey = ONBOARDING_STEP_ACTION_KEYS[stepKey];
    if (!actionKey || typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(getOnboardingActionStorageKey(actionKey)) === '1';
  };

  const syncValidatedOnboardingSteps = async () => {
    if (!userId || onboardingSteps.length === 0) return;
    const currentStep = onboardingSteps.find((step) => !step.completed);
    if (!currentStep) return;
    if (!isStepActionValidated(currentStep.step_key)) return;
    setIsAutoValidatingStep(true);
    try {
      const token = window.sessionStorage.getItem('tracebud_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch('/api/launch/onboarding', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: onboardingRole, stepKey: currentStep.step_key }),
      });
      const payload = await response.json().catch(() => null);
      const nextSteps =
        Array.isArray(payload) && payload.length > 0
          ? payload
          : onboardingSteps.map((step) =>
              step.step_key === currentStep.step_key ? { ...step, completed: true } : step,
            );
      setOnboardingSteps(nextSteps);
      if (onboardingDismissKey) {
        window.sessionStorage.removeItem(onboardingDismissKey);
      }
      const nextStep = nextSteps.find((step) => !step.completed);
      if (nextStep) {
        openOnboardingStepFeature(nextStep.step_key);
      }
    } finally {
      setIsAutoValidatingStep(false);
    }
  };

  useEffect(() => {
    void syncValidatedOnboardingSteps();
    // This effect should run whenever onboarding state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, onboardingSteps]);

  useEffect(() => {
    const handleOnboardingAction = () => {
      void syncValidatedOnboardingSteps();
    };
    window.addEventListener('tracebud:onboarding-action', handleOnboardingAction);
    return () => {
      window.removeEventListener('tracebud:onboarding-action', handleOnboardingAction);
    };
    // Listener should be rebound when user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Determine which dashboard to show based on user role
  const renderDashboard = () => {
    if (!user) return null;

    const metrics = dashboardMetrics ?? VIRGIN_DASHBOARD_METRICS;

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
        return 'Manage upstream aggregation, lineage integrity, and shipment readiness';
      case 'importer':
        return 'Monitor supply chain compliance status';
      case 'cooperative':
        return 'Manage members, field operations, consent, portability, and cooperative governance';
      case 'country_reviewer':
        return 'Review and verify compliance submissions';
      case 'sponsor':
        return 'Govern network health, delegated admin scope, programme outcomes, and sponsored coverage';
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
        {isWelcomeEntry ? (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm">
            <div className="font-semibold text-emerald-900">Welcome to your new Tracebud workspace</div>
            <div className="mt-1 text-emerald-800">
              Your environment is ready. Take a quick look around, then start onboarding when you are ready.
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams.toString());
                  nextParams.delete('welcome');
                  nextParams.delete('entry');
                  const nextQuery = nextParams.toString();
                  setWelcomeAcknowledged(true);
                  router.replace(nextQuery ? `/?${nextQuery}` : '/');
                  if (activeOnboardingStep) {
                    openOnboardingStepFeature(activeOnboardingStep.step_key);
                    return;
                  }
                  resumeOnboarding();
                }}
              >
                Start onboarding
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams.toString());
                  nextParams.delete('welcome');
                  nextParams.delete('entry');
                  const nextQuery = nextParams.toString();
                  setWelcomeAcknowledged(true);
                  router.replace(nextQuery ? `/?${nextQuery}` : '/');
                }}
              >
                Explore workspace first
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mb-6">
          <OnboardingChecklistCard />
        </div>
        {trialState ? (
          <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">
            <div className="font-semibold">Launch Access</div>
            <div className="text-muted-foreground">
              Status: {trialState.lifecycle_status}
              {trialState.trial_expires_at ? ` · Trial ends ${new Date(trialState.trial_expires_at).toLocaleDateString()}` : ''}
            </div>
            {trialState.lifecycle_status === 'trial_expired' ? (
              <div className="mt-2 text-amber-600">
                Your trial has expired. Upgrade is required to continue premium workflows.
              </div>
            ) : null}
          </div>
        ) : null}
        {renderDashboard()}
      </div>
      <Dialog
        open={isOnboardingDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            skipOnboardingForNow();
            setOnboardingNavigationNotice(null);
            return;
          }
          setOnboardingNavigationNotice(null);
          setIsOnboardingDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeOnboardingStepIndex === -1
                ? 'Onboarding complete'
                : `Step ${currentStepNumber} of ${onboardingSteps.length}`}
            </DialogTitle>
            <DialogDescription>
              {activeOnboardingStepIndex === -1
                ? 'You have completed all onboarding steps for this role.'
                : currentStepCopy?.description}
            </DialogDescription>
          </DialogHeader>
          {activeOnboardingStepIndex !== -1 ? (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="text-sm font-semibold">{currentStepCopy?.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  You can skip onboarding anytime, then resume later from the dashboard onboarding card.
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${onboardingProgress}%` }} />
              </div>
              {onboardingNavigationNotice ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                  {onboardingNavigationNotice}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            {activeOnboardingStepIndex === -1 ? (
              <Button
                onClick={() => {
                  setIsOnboardingDialogOpen(false);
                }}
              >
                Finish
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={skipOnboardingForNow}>
                  Skip for now
                </Button>
                <Button variant="outline" onClick={goToCurrentStepFeature}>
                  {currentStepCopy?.ctaLabel ?? 'Open feature'}
                </Button>
                <Button
                  onClick={() => {
                    void syncValidatedOnboardingSteps();
                  }}
                  disabled={!activeOnboardingStep || !isStepActionValidated(activeOnboardingStep.step_key) || isAutoValidatingStep}
                >
                  {isAutoValidatingStep ? 'Validating...' : 'Validate completed action'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
