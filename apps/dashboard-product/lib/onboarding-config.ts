// ============================================================
// ONBOARDING CONFIGURATION
// Role-based step config + microcopy for all 3 personas
// ============================================================

import type { TenantRole } from '@/types';
import type { CommercialPermission } from '@/lib/rbac';
import { trackDashboardEvent } from '@/lib/observability/analytics';

export type OnboardingPersona = 'cooperative' | 'exporter' | 'importer' | 'sponsor';

export interface OnboardingStep {
  /** Unique key used for persistence / analytics */
  key: string;
  /** Short label shown in progress bar */
  label: string;
  /** Tooltip headline (max ~40 chars) */
  title: string;
  /** Tooltip body copy (max 2 lines) */
  description: string;
  /** CTA button label */
  ctaLabel: string;
  /** Route the CTA navigates to */
  ctaHref: string;
  /**
   * CSS selector or data-attribute used to spotlight the target element.
   * null = no spotlight (e.g. modal-only step)
   */
  targetSelector: string | null;
  /** Whether this step requires a real user action to be marked complete */
  requiresAction: boolean;
  /** Action key that marks this step complete (matches OnboardingActionKey) */
  actionKey?: string;
  /** Inline icon name from lucide-react */
  icon: string;
  /** Optional permission gate so steps render only when relevant */
  requiredPermission?: CommercialPermission;
}

export interface OnboardingConfig {
  persona: OnboardingPersona;
  displayName: string;
  tagline: string;
  steps: OnboardingStep[];
}

// ─────────────────────────────────────────────────────────────
// PRODUCER / COOPERATIVE
// ─────────────────────────────────────────────────────────────
const COOPERATIVE_STEPS: OnboardingStep[] = [
  {
    key: 'coop_overview',
    label: 'Overview',
    title: 'Start from cooperative overview',
    description: 'Track readiness, member coverage, blocked batches, and governance alerts from one cockpit.',
    ctaLabel: 'View overview',
    ctaHref: '/',
    targetSelector: '[data-onboarding="nav-overview"]',
    requiresAction: false,
    icon: 'LayoutDashboard',
  },
  {
    key: 'coop_members',
    label: 'Members',
    title: 'Build your member directory',
    description: 'Create member profiles to anchor consent, portability, and cooperative participation records.',
    ctaLabel: 'Add member',
    ctaHref: '/contacts/add?mode=contact',
    targetSelector: '[data-onboarding="nav-farmers"]',
    requiresAction: true,
    actionKey: 'contacts_uploaded',
    icon: 'Users',
  },
  {
    key: 'coop_plots',
    label: 'Plots',
    title: 'Review member plot coverage',
    description: 'Validate geometry quality and risk status so lots and shipments inherit reliable root-plot coverage.',
    ctaLabel: 'Open plots',
    ctaHref: '/plots',
    targetSelector: '[data-onboarding="nav-plots"]',
    requiresAction: true,
    actionKey: 'first_plot_captured',
    icon: 'MapPin',
  },
  {
    key: 'coop_field_operations',
    label: 'Field Operations',
    title: 'Run field remediation queues',
    description: 'Coordinate field agents on missing consent, missing geometry, duplicate review, and sync quality tasks.',
    ctaLabel: 'Open field operations',
    ctaHref: '/field-operations',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: false,
    icon: 'MapPin',
  },
  {
    key: 'coop_lots_batches',
    label: 'Received lots',
    title: 'Receive your first member delivery',
    description:
      'Scan harvest vouchers shared by members from the field app, then assemble plot-linked batches for shipment prep.',
    ctaLabel: 'Register delivery',
    ctaHref: '/harvests#register-delivery',
    targetSelector: '[data-onboarding="nav-harvests"]',
    requiresAction: true,
    actionKey: 'first_submission_synced',
    icon: 'Leaf',
  },
  {
    key: 'coop_shipments',
    label: 'Shipments',
    title: 'Prepare shipment handoff',
    description: 'Assemble shipment lines, resolve blockers, and confirm readiness before sealing and downstream handoff.',
    ctaLabel: 'Open shipments',
    ctaHref: '/packages',
    targetSelector: '[data-onboarding="nav-packages"]',
    requiresAction: false,
    icon: 'Package',
  },
  {
    key: 'coop_governance',
    label: 'Governance',
    title: 'Review governance actions',
    description: 'Track premium approvals, portability review, and cooperative health requirements in one governance workspace.',
    ctaLabel: 'Open governance',
    ctaHref: '/governance',
    targetSelector: '[data-onboarding="nav-settings"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'Scale',
  },
];

// ─────────────────────────────────────────────────────────────
// EXPORTER
// ─────────────────────────────────────────────────────────────
const EXPORTER_STEPS: OnboardingStep[] = [
  {
    key: 'exp_producers',
    label: 'Add suppliers',
    title: 'Register your supplier network',
    description:
      'Import or add suppliers early so traceability links, campaigns, and coverage checks stay grounded in real upstream entities.',
    ctaLabel: 'Import supplier list',
    ctaHref: '/contacts/add?mode=csv',
    targetSelector: '[data-onboarding="nav-contacts"]',
    requiresAction: true,
    actionKey: 'contacts_uploaded',
    icon: 'Users',
  },
  {
    key: 'exp_evidence',
    label: 'Evidence',
    title: 'Validate evidence coverage',
    description: 'Review evidence records to confirm producer, plot, and shipment artifacts are complete before sealing.',
    ctaLabel: 'Open evidence',
    ctaHref: '/fpic',
    targetSelector: '[data-onboarding="nav-fpic"]',
    requiresAction: false,
    icon: 'FileCheck',
    requiredPermission: 'fpic:view',
  },
  {
    key: 'exp_campaign',
    label: 'Campaigns',
    title: 'Send your first data-request campaign',
    description: 'Campaigns batch-request plot geometry, harvest records, or evidence from multiple suppliers at once.',
    ctaLabel: 'Launch campaign',
    ctaHref: '/outreach?new=1',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: true,
    actionKey: 'campaign_created',
    icon: 'Send',
  },
  {
    key: 'exp_lots_batches',
    label: 'Received lots',
    title: 'Review received lots',
    description:
      'Open upstream lots shared by cooperatives or suppliers, then assemble them into seal-ready shipments.',
    ctaLabel: 'View received lots',
    ctaHref: '/harvests',
    targetSelector: '[data-onboarding="nav-harvests"]',
    requiresAction: false,
    icon: 'Leaf',
  },
  {
    key: 'exp_issues',
    label: 'Resolve issues',
    title: 'Review sealing blockers',
    description: 'Use the issues board to assign and resolve blockers that prevent shipment sealing and downstream handoff.',
    ctaLabel: 'Open issues',
    ctaHref: '/compliance/issues',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
  },
];

// ─────────────────────────────────────────────────────────────
// IMPORTER / BRAND
// ─────────────────────────────────────────────────────────────
const IMPORTER_STEPS: OnboardingStep[] = [
  {
    key: 'imp_network',
    label: 'Network',
    title: 'Set up your importer network',
    description: 'Add counterpart contacts so campaigns and inbound requests route to the right teams.',
    ctaLabel: 'Add contact',
    ctaHref: '/contacts/add?mode=contact',
    targetSelector: '[data-onboarding="nav-contacts"]',
    requiresAction: false,
    icon: 'Users',
  },
  {
    key: 'imp_campaigns',
    label: 'Campaigns',
    title: 'Launch your first campaign',
    description: 'Send outbound campaigns to collect missing upstream evidence and references.',
    ctaLabel: 'Launch campaign',
    ctaHref: '/outreach?new=1',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: false,
    icon: 'Send',
  },
  {
    key: 'imp_requests',
    label: 'Requests',
    title: 'Track inbound requests',
    description: 'Review and fulfill requests from downstream customers and partners.',
    ctaLabel: 'Open requests',
    ctaHref: '/inbox',
    targetSelector: '[data-onboarding="nav-inbox"]',
    requiresAction: false,
    icon: 'Inbox',
  },
  {
    key: 'imp_shipments',
    label: 'Shipments',
    title: 'Review shipment readiness',
    description: 'Check inbound shipment completeness and status before declaration submission.',
    ctaLabel: 'Open shipments',
    ctaHref: '/packages',
    targetSelector: '[data-onboarding="nav-packages"]',
    requiresAction: false,
    icon: 'Package',
  },
  {
    key: 'imp_compliance',
    label: 'Compliance',
    title: 'Run declaration readiness checks',
    description: 'Resolve blockers and warnings so shipments are ready for DDS submission.',
    ctaLabel: 'Open compliance',
    ctaHref: '/compliance',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
  },
  {
    key: 'imp_evidence',
    label: 'Evidence',
    title: 'Validate supporting evidence',
    description: 'Review evidence records and provenance before making declaration decisions.',
    ctaLabel: 'Open evidence',
    ctaHref: '/fpic',
    targetSelector: '[data-onboarding="nav-fpic"]',
    requiresAction: false,
    icon: 'FileCheck',
    requiredPermission: 'fpic:view',
  },
  {
    key: 'imp_reporting',
    label: 'Reporting',
    title: 'Generate your first reporting snapshot',
    description: 'Create reporting snapshots for annual obligations and operational follow-up.',
    ctaLabel: 'Open reporting',
    ctaHref: '/reports',
    targetSelector: '[data-onboarding="nav-reports"]',
    requiresAction: true,
    actionKey: 'insight_generated',
    icon: 'FileText',
  },
];

const SPONSOR_STEPS: OnboardingStep[] = [
  {
    key: 'sp_overview',
    label: 'Overview',
    title: 'Use the governance cockpit',
    description: 'Start from the sponsor overview to monitor network activation, risk posture, and intervention alerts.',
    ctaLabel: 'Open overview',
    ctaHref: '/',
    targetSelector: '[data-onboarding="nav-overview"]',
    requiresAction: false,
    icon: 'LayoutDashboard',
  },
  {
    key: 'sp_organisations',
    label: 'Organisations',
    title: 'Map your governed network',
    description: 'Review member organisations, activation status, and sponsor-funded coverage across the network.',
    ctaLabel: 'Open organisations',
    ctaHref: '/organisations',
    targetSelector: '[data-onboarding="nav-organisations"]',
    requiresAction: true,
    actionKey: 'contacts_uploaded',
    icon: 'Building2',
  },
  {
    key: 'sp_programmes',
    label: 'Programmes',
    title: 'Launch your first programme campaign',
    description: 'Create a bulk request campaign to collect missing evidence or remediation data from upstream organisations.',
    ctaLabel: 'Open programmes',
    ctaHref: '/programmes',
    targetSelector: '[data-onboarding="nav-programmes"]',
    requiresAction: true,
    actionKey: 'campaign_created',
    icon: 'Send',
  },
  {
    key: 'sp_compliance_health',
    label: 'Compliance Health',
    title: 'Review network readiness',
    description: 'Use compliance health to identify cross-network risk patterns and priority escalation clusters.',
    ctaLabel: 'Open compliance health',
    ctaHref: '/compliance-health',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
  },
  {
    key: 'sp_reporting',
    label: 'Reporting',
    title: 'Generate your first sponsor insight',
    description: 'Open reporting to track programme outcomes, network performance, and governance KPIs.',
    ctaLabel: 'Open reporting',
    ctaHref: '/reports',
    targetSelector: '[data-onboarding="nav-reports"]',
    requiresAction: true,
    actionKey: 'insight_generated',
    icon: 'FileText',
  },
];

// ─────────────────────────────────────────────────────────────
// CONFIG MAP
// ─────────────────────────────────────────────────────────────
export const ONBOARDING_CONFIGS: Record<OnboardingPersona, OnboardingConfig> = {
  cooperative: {
    persona: 'cooperative',
    displayName: 'Cooperative',
    tagline: 'Manage members, field operations, aggregation, shipments, and governance in one workspace.',
    steps: COOPERATIVE_STEPS,
  },
  exporter: {
    persona: 'exporter',
    displayName: 'Exporter',
    tagline: 'Aggregate upstream inputs, validate lineage, and prepare shipment-ready traceability.',
    steps: EXPORTER_STEPS,
  },
  importer: {
    persona: 'importer',
    displayName: 'Importer / Brand',
    tagline: 'Own the DDS filing process, review data, and meet EUDR obligations.',
    steps: IMPORTER_STEPS,
  },
  sponsor: {
    persona: 'sponsor',
    displayName: 'Network Sponsor',
    tagline: 'Govern network health, delegated admin scope, programme campaigns, and sponsored coverage.',
    steps: SPONSOR_STEPS,
  },
};

// Map TenantRole → OnboardingPersona
export function tenantRoleToPersona(role: TenantRole): OnboardingPersona {
  if (role === 'cooperative') return 'cooperative';
  if (role === 'importer' || role === 'country_reviewer') return 'importer';
  if (role === 'sponsor') return 'sponsor';
  return 'exporter';
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS EVENT MAP
// ─────────────────────────────────────────────────────────────
export type OnboardingAnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed';

export interface OnboardingAnalyticsPayload {
  event: OnboardingAnalyticsEvent;
  persona: OnboardingPersona;
  stepKey?: string;
  stepIndex?: number;
  totalSteps?: number;
}

/** Onboarding funnel events → Vercel Analytics + Sentry breadcrumbs. */
export function trackOnboardingEvent(payload: OnboardingAnalyticsPayload): void {
  if (typeof window === 'undefined') return;
  trackDashboardEvent(payload.event, {
    persona: payload.persona,
    stepKey: payload.stepKey,
    stepIndex: payload.stepIndex,
    totalSteps: payload.totalSteps,
  });
}
