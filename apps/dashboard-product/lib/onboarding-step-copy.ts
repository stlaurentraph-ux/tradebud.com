import type { OnboardingConfig, OnboardingPersona } from '@/lib/onboarding-config';

type TranslateFn = (key: string) => string;
type StepField = 'label' | 'title' | 'description' | 'ctaLabel';

function wf(key: string, fallback: string, t?: TranslateFn): string {
  if (!t) return fallback;
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

const ONBOARDING_PERSONA_FALLBACKS: Record<
  OnboardingPersona,
  { displayName: string; tagline: string }
> = {
  cooperative: {
    displayName: 'Cooperative',
    tagline: 'Manage members, field operations, aggregation, shipments, and governance in one workspace.',
  },
  exporter: {
    displayName: 'Exporter',
    tagline: 'Aggregate upstream inputs, validate lineage, and prepare shipment-ready traceability.',
  },
  importer: {
    displayName: 'Importer / Brand',
    tagline: 'Own the DDS filing process, review data, and meet EUDR obligations.',
  },
  sponsor: {
    displayName: 'Network Sponsor',
    tagline: 'Govern network health, delegated admin scope, programme campaigns, and sponsored coverage.',
  },
};

const ONBOARDING_STEP_FALLBACKS: Record<string, Record<StepField, string>> = {
  coop_overview: {
    label: 'Overview',
    title: 'Start from cooperative overview',
    description:
      'Track readiness, member coverage, blocked batches, and governance alerts from one cockpit.',
    ctaLabel: 'View overview',
  },
  coop_members: {
    label: 'Members',
    title: 'Build your member directory',
    description:
      'Create member profiles to anchor consent, portability, and cooperative participation records.',
    ctaLabel: 'Add member',
  },
  coop_plots: {
    label: 'Plots',
    title: 'Review member plot coverage',
    description:
      'Validate geometry quality and risk status so lots and shipments inherit reliable root-plot coverage.',
    ctaLabel: 'Open plots',
  },
  coop_field_operations: {
    label: 'Field Operations',
    title: 'Run field remediation queues',
    description:
      'Coordinate field agents on missing consent, missing geometry, duplicate review, and sync quality tasks.',
    ctaLabel: 'Open field operations',
  },
  coop_lots_batches: {
    label: 'Lots & Batches',
    title: 'Record your first lot or batch',
    description:
      'Start aggregation records to run yield plausibility checks and prepare lineage-safe shipment assembly.',
    ctaLabel: 'Add batch input',
  },
  coop_shipments: {
    label: 'Shipments',
    title: 'Prepare shipment handoff',
    description:
      'Assemble shipment lines, resolve blockers, and confirm readiness before sealing and downstream handoff.',
    ctaLabel: 'Open shipments',
  },
  coop_governance: {
    label: 'Governance',
    title: 'Review governance actions',
    description:
      'Track premium approvals, portability review, and cooperative health requirements in one governance workspace.',
    ctaLabel: 'Open governance',
  },
  exp_producers: {
    label: 'Add producers',
    title: 'Create your producer directory',
    description:
      'Add producers early so traceability links, requests, and coverage checks stay grounded in real upstream entities.',
    ctaLabel: 'Add producer',
  },
  exp_evidence: {
    label: 'Evidence',
    title: 'Validate evidence coverage',
    description:
      'Review evidence records to confirm producer, plot, and shipment artifacts are complete before sealing.',
    ctaLabel: 'Open evidence',
  },
  exp_campaign: {
    label: 'Campaigns',
    title: 'Send your first data-request campaign',
    description:
      'Campaigns batch-request plot geometry, harvest records, or evidence from multiple suppliers at once.',
    ctaLabel: 'Launch campaign',
  },
  exp_lots_batches: {
    label: 'Lots & Batches',
    title: 'Build your first aggregation batch',
    description:
      'Use lots and batches to aggregate upstream inputs, run yield plausibility checks, and lock lineage.',
    ctaLabel: 'Add batch input',
  },
  exp_issues: {
    label: 'Resolve issues',
    title: 'Review sealing blockers',
    description:
      'Use the issues board to assign and resolve blockers that prevent shipment sealing and downstream handoff.',
    ctaLabel: 'Open issues',
  },
  imp_network: {
    label: 'Network',
    title: 'Set up your importer network',
    description: 'Add counterpart contacts so campaigns and inbound requests route to the right teams.',
    ctaLabel: 'Add contact',
  },
  imp_campaigns: {
    label: 'Campaigns',
    title: 'Launch your first campaign',
    description: 'Send outbound campaigns to collect missing upstream evidence and references.',
    ctaLabel: 'Launch campaign',
  },
  imp_requests: {
    label: 'Requests',
    title: 'Track inbound requests',
    description: 'Review and fulfill requests from downstream customers and partners.',
    ctaLabel: 'Open requests',
  },
  imp_shipments: {
    label: 'Shipments',
    title: 'Review shipment readiness',
    description: 'Check inbound shipment completeness and status before declaration submission.',
    ctaLabel: 'Open shipments',
  },
  imp_compliance: {
    label: 'Compliance',
    title: 'Run declaration readiness checks',
    description: 'Resolve blockers and warnings so shipments are ready for DDS submission.',
    ctaLabel: 'Open compliance',
  },
  imp_evidence: {
    label: 'Evidence',
    title: 'Validate supporting evidence',
    description: 'Review evidence records and provenance before making declaration decisions.',
    ctaLabel: 'Open evidence',
  },
  imp_reporting: {
    label: 'Reporting',
    title: 'Generate your first reporting snapshot',
    description: 'Create reporting snapshots for annual obligations and operational follow-up.',
    ctaLabel: 'Open reporting',
  },
  sp_overview: {
    label: 'Overview',
    title: 'Use the governance cockpit',
    description:
      'Start from the sponsor overview to monitor network activation, risk posture, and intervention alerts.',
    ctaLabel: 'Open overview',
  },
  sp_organisations: {
    label: 'Organisations',
    title: 'Map your governed network',
    description:
      'Review member organisations, activation status, and sponsor-funded coverage across the network.',
    ctaLabel: 'Open organisations',
  },
  sp_programmes: {
    label: 'Programmes',
    title: 'Launch your first programme campaign',
    description:
      'Create a bulk request campaign to collect missing evidence or remediation data from upstream organisations.',
    ctaLabel: 'Open programmes',
  },
  sp_compliance_health: {
    label: 'Compliance Health',
    title: 'Review network readiness',
    description:
      'Use compliance health to identify cross-network risk patterns and priority escalation clusters.',
    ctaLabel: 'Open compliance health',
  },
  sp_reporting: {
    label: 'Reporting',
    title: 'Generate your first sponsor insight',
    description: 'Open reporting to track programme outcomes, network performance, and governance KPIs.',
    ctaLabel: 'Open reporting',
  },
};

function onboardingStepKey(stepKey: string, field: StepField): string {
  return `workflow.onboarding.step.${stepKey}.${field}`;
}

function onboardingPersonaKey(persona: OnboardingPersona, field: 'displayName' | 'tagline'): string {
  return `workflow.onboarding.persona.${persona}.${field}`;
}

export function getOnboardingStepCopy(
  stepKey: string,
  field: StepField,
  t?: TranslateFn,
): string {
  const fallback = ONBOARDING_STEP_FALLBACKS[stepKey]?.[field] ?? stepKey;
  return wf(onboardingStepKey(stepKey, field), fallback, t);
}

export function getOnboardingPersonaCopy(
  persona: OnboardingPersona,
  field: 'displayName' | 'tagline',
  t?: TranslateFn,
): string {
  const fallback = ONBOARDING_PERSONA_FALLBACKS[persona][field];
  return wf(onboardingPersonaKey(persona, field), fallback, t);
}

export function localizeOnboardingConfig(config: OnboardingConfig, t?: TranslateFn): OnboardingConfig {
  return {
    ...config,
    displayName: getOnboardingPersonaCopy(config.persona, 'displayName', t),
    tagline: getOnboardingPersonaCopy(config.persona, 'tagline', t),
    steps: config.steps.map((step) => ({
      ...step,
      label: getOnboardingStepCopy(step.key, 'label', t),
      title: getOnboardingStepCopy(step.key, 'title', t),
      description: getOnboardingStepCopy(step.key, 'description', t),
      ctaLabel: getOnboardingStepCopy(step.key, 'ctaLabel', t),
    })),
  };
}

export const ONBOARDING_STEP_KEYS = Object.keys(ONBOARDING_STEP_FALLBACKS);

export function getOnboardingStepCopyManifest(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const [stepKey, fields] of Object.entries(ONBOARDING_STEP_FALLBACKS)) {
    for (const [field, fallback] of Object.entries(fields)) {
      manifest[onboardingStepKey(stepKey, field as StepField)] = fallback;
    }
  }
  for (const [persona, fields] of Object.entries(ONBOARDING_PERSONA_FALLBACKS)) {
    manifest[onboardingPersonaKey(persona as OnboardingPersona, 'displayName')] = fields.displayName;
    manifest[onboardingPersonaKey(persona as OnboardingPersona, 'tagline')] = fields.tagline;
  }
  return manifest;
}
