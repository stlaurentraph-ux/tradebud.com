'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { ExporterDashboard } from '@/components/dashboards/exporter-dashboard';
import { ImporterDashboard } from '@/components/dashboards/importer-dashboard';
import { CooperativeDashboard } from '@/components/dashboards/cooperative-dashboard';
import { ReviewerDashboard } from '@/components/dashboards/reviewer-dashboard';
import { SponsorDashboard } from '@/components/dashboards/sponsor-dashboard';
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
import { getRoleDisplayName } from '@/lib/rbac';
import type { ShipmentStatus } from '@/types';

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
    href: '/requests?openCreateCampaign=1',
  },
  upload_contacts: {
    title: 'Upload initial contacts',
    description: 'Add partners and operators so requests route correctly and no manual reassignment is needed later.',
    ctaLabel: 'Open contacts',
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
    href: '/requests',
  },
  capture_first_plot: {
    title: 'Capture your first plot',
    description: 'Create a first plot record to validate geometry and start your submission lineage.',
    ctaLabel: 'Open plots',
    href: '/plots',
  },
  sync_first_submission: {
    title: 'Sync your first submission',
    description: 'Submit one complete payload so your dashboard and audit events confirm end-to-end flow.',
    ctaLabel: 'Open harvests',
    href: '/harvests',
  },
  review_first_submission: {
    title: 'Review a first submission',
    description: 'Use the compliance review queue to validate required checks and escalation paths.',
    ctaLabel: 'Open compliance',
    href: '/compliance/issues',
  },
  run_first_compliance_check: {
    title: 'Run your first compliance check',
    description: 'Validate controls on a live record before filing or approving production submissions.',
    ctaLabel: 'Open role decisions',
    href: '/role-decisions',
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

const VIRGIN_DASHBOARD_METRICS: {
  total_packages: number;
  packages_by_status: Record<ShipmentStatus, number>;
  total_plots: number;
  compliant_plots: number;
  total_farmers: number;
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
};

export default function DashboardPage() {
  const { user } = useAuth();
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

  const markStepCompleted = async (stepKey: string) => {
    setOnboardingSteps((previous) =>
      previous.map((step) => (step.step_key === stepKey ? { ...step, completed: true } : step)),
    );
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch('/api/launch/onboarding', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: onboardingRole, stepKey }),
    });
    const payload = await response.json().catch(() => null);
    if (Array.isArray(payload) && payload.length > 0) {
      setOnboardingSteps(payload);
    }
    if (onboardingDismissKey) {
      window.sessionStorage.removeItem(onboardingDismissKey);
    }
  };

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
    ? ONBOARDING_COPY[activeOnboardingStep.step_key] ?? {
        title: activeOnboardingStep.step_key.replaceAll('_', ' '),
        description: 'Complete this step to continue your onboarding sequence.',
        ctaLabel: 'Open feature',
        href: '/',
      }
    : null;

  const currentStepNumber = activeOnboardingStepIndex + 1;

  const goToCurrentStepFeature = () => {
    if (!currentStepCopy) return;
    const gate = getDeferredGateForPath(currentStepCopy.href);
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
            redirectedPath: currentStepCopy.href,
          }),
        }).catch(() => undefined);
      }
      router.push('/');
      return;
    }
    setOnboardingNavigationNotice(null);
    router.push(currentStepCopy.href);
    setIsOnboardingDialogOpen(false);
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
    const nextStep = onboardingSteps.find((step) => !step.completed);
    if (!nextStep) return;
    if (!isStepActionValidated(nextStep.step_key)) return;
    setIsAutoValidatingStep(true);
    try {
      await markStepCompleted(nextStep.step_key);
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

    const metrics = VIRGIN_DASHBOARD_METRICS;

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
        {onboardingSteps.length > 0 ? (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">Autonomous onboarding</div>
              {activeOnboardingStepIndex !== -1 ? (
                <Button size="sm" variant="outline" onClick={resumeOnboarding}>
                  Resume guide
                </Button>
              ) : (
                <span className="text-xs font-medium text-emerald-600">Completed</span>
              )}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${onboardingProgress}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Progress: {onboardingProgress}% ({onboardingSteps.filter((step) => step.completed).length}/{onboardingSteps.length})
            </div>
            <div className="mt-2 space-y-2">
              {onboardingSteps.map((step) => (
                <div key={step.step_key} className="flex items-center justify-between gap-3">
                  <span className={step.completed ? 'text-muted-foreground line-through' : ''}>
                    {step.step_key.replaceAll('_', ' ')}
                  </span>
                  {step.completed ? (
                    <span className="text-emerald-600">Done</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Waiting for action</span>
                  )}
                </div>
              ))}
            </div>
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
