import type { ShipmentStatus } from '@/types';

export const ONBOARDING_COPY: Record<
  string,
  { title: string; description: string; ctaLabel: string; href: string }
> = {
  create_account: {
    title: 'Complete your account setup',
    description:
      'Confirm your organization profile so permissions, trial status, and audit logs stay consistent.',
    ctaLabel: 'Open settings',
    href: '/settings',
  },
  create_first_campaign: {
    title: 'Create your first campaign',
    description:
      'Campaigns define who can submit records and keep onboarding scoped to your active workflow.',
    ctaLabel: 'Open campaigns',
    href: '/requests?openCreateCampaign=1',
  },
  upload_contacts: {
    title: 'Upload initial contacts',
    description:
      'Add partners and operators so requests route correctly and no manual reassignment is needed later.',
    ctaLabel: 'Open contacts',
    href: '/contacts',
  },
  invite_field_team: {
    title: 'Invite your field team',
    description:
      'Assign collaborators early so capture and review tasks can run in parallel from day one.',
    ctaLabel: 'Open users',
    href: '/admin/users',
  },
  generate_first_insight: {
    title: 'Generate your first insight',
    description:
      'Run your first dashboard workflow to validate data quality and establish a baseline.',
    ctaLabel: 'Open dashboard',
    href: '/',
  },
  join_campaign: {
    title: 'Join your first campaign',
    description:
      'Joining a campaign links your field activity to the correct compliance process.',
    ctaLabel: 'Open campaigns',
    href: '/requests',
  },
  capture_first_plot: {
    title: 'Capture your first plot',
    description:
      'Create a first plot record to validate geometry and start your submission lineage.',
    ctaLabel: 'Open plots',
    href: '/plots',
  },
  sync_first_submission: {
    title: 'Sync your first submission',
    description:
      'Submit one complete payload so your dashboard and audit events confirm end-to-end flow.',
    ctaLabel: 'Open harvests',
    href: '/harvests',
  },
  review_first_submission: {
    title: 'Review a first submission',
    description:
      'Use the compliance review queue to validate required checks and escalation paths.',
    ctaLabel: 'Open compliance',
    href: '/compliance/issues',
  },
  run_first_compliance_check: {
    title: 'Run your first compliance check',
    description:
      'Validate controls on a live record before filing or approving production submissions.',
    ctaLabel: 'Open role decisions',
    href: '/role-decisions',
  },
};

export const ONBOARDING_STEP_ACTION_KEYS: Record<string, string | null> = {
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

export function getOnboardingActionStorageKey(actionKey: string): string {
  return `tracebud_onboarding_action_${actionKey}`;
}

export const VIRGIN_DASHBOARD_METRICS: {
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
