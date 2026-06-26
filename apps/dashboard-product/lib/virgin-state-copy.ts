import type { TenantRole } from '@/types';

type TranslateFn = (key: string) => string;
type StepField = 'title' | 'description' | 'ctaLabel';

function wf(key: string, fallback: string, t?: TranslateFn, values?: Record<string, string | number>): string {
  if (!t) {
    const text = fallback;
    if (!values) return text;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
      text,
    );
  }
  const resolved = t(key);
  const text = resolved === key ? fallback : resolved;
  if (!values) return text;
  return Object.entries(values).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    text,
  );
}

export const VIRGIN_STEP_IDS: Record<TenantRole, string[]> = {
  exporter: ['register_producers', 'map_plots', 'link_received_lots', 'create_shipment'],
  importer: ['build_network', 'launch_campaign', 'review_shipments'],
  cooperative: ['add_members', 'register_plots', 'launch_campaign'],
  country_reviewer: ['open_queue', 'inspect_packages', 'resolve_decisions'],
  sponsor: ['invite_contacts', 'register_orgs', 'launch_programme', 'review_compliance'],
};

const VIRGIN_STEP_HREFS: Record<string, string> = {
  register_producers: '/contacts/add?mode=csv',
  map_plots: '/outreach?new=1',
  link_received_lots: '/harvests',
  create_shipment: '/packages/new',
  build_network: '/contacts/add?mode=contact',
  launch_campaign: '/outreach?new=1',
  review_shipments: '/packages',
  add_members: '/contacts/add?mode=contact',
  register_plots: '/plots',
  open_queue: '/compliance/queue',
  inspect_packages: '/packages',
  resolve_decisions: '/role-decisions',
  invite_contacts: '/contacts/add?mode=contact',
  register_orgs: '/organisations',
  launch_programme: '/programmes?new=1',
  review_compliance: '/compliance-health',
};

const VIRGIN_HEADING_FALLBACKS: Record<TenantRole, { title: string; description: string }> = {
  exporter: {
    title: 'Set up your export workspace',
    description: 'Complete these steps to move from empty workspace to your first seal-ready shipment.',
  },
  importer: {
    title: 'Start collecting upstream evidence',
    description: 'Build your network, request missing data, then validate shared shipments for declaration.',
  },
  cooperative: {
    title: 'Onboard your cooperative',
    description: 'Register members and plots, then launch field campaigns to close data gaps.',
  },
  country_reviewer: {
    title: 'Open your review workspace',
    description: 'No submissions are in queue yet. Use these entry points when packages arrive.',
  },
  sponsor: {
    title: 'Build your sponsor oversight network',
    description:
      'Invite supply chain contacts, classify them by role, and track transparency across countries and commodities.',
  },
};

const VIRGIN_STEP_FALLBACKS: Record<TenantRole, Record<string, Record<StepField, string>>> = {
  exporter: {
    register_producers: {
      title: 'Register suppliers',
      description:
        'Add upstream suppliers — cooperatives, producers, washing stations, and processing plants. Bulk import from CSV.',
      ctaLabel: 'Import suppliers',
    },
    map_plots: {
      title: 'Import or request plots',
      description:
        'Import plot files or request boundaries from producers. You do not need to map plots yourself in the field.',
      ctaLabel: 'Request plot data',
    },
    link_received_lots: {
      title: 'Link received lots',
      description:
        'Review lots shared by upstream cooperatives or suppliers and attach them to your export workspace before sealing.',
      ctaLabel: 'View received lots',
    },
    create_shipment: {
      title: 'Create your first shipment',
      description: 'Assemble lines, run readiness checks, and seal for importer handoff.',
      ctaLabel: 'Create shipment',
    },
  },
  importer: {
    build_network: {
      title: 'Build your network',
      description: 'Add exporter and partner contacts so campaigns route to the right teams.',
      ctaLabel: 'Add contact',
    },
    launch_campaign: {
      title: 'Launch a campaign',
      description: 'Request missing upstream evidence and references before you declare.',
      ctaLabel: 'Launch campaign',
    },
    review_shipments: {
      title: 'Review shared shipments',
      description: 'Open shipments shared with your organisation and check declaration readiness.',
      ctaLabel: 'View shared shipments',
    },
  },
  cooperative: {
    add_members: {
      title: 'Add members',
      description: 'Register cooperative members and capture consent before field capture begins.',
      ctaLabel: 'Add member',
    },
    register_plots: {
      title: 'Register plots',
      description: 'Start plot registration and geometry verification for member land.',
      ctaLabel: 'Open plots',
    },
    launch_campaign: {
      title: 'Launch a field campaign',
      description: 'Collect missing geometry, evidence, and harvest data from members.',
      ctaLabel: 'Launch campaign',
    },
  },
  country_reviewer: {
    open_queue: {
      title: 'Open the compliance queue',
      description: 'Review flagged packages and evidence submitted for your jurisdiction.',
      ctaLabel: 'Open queue',
    },
    inspect_packages: {
      title: 'Inspect DDS packages',
      description: 'Search packages by exporter, commodity, and compliance status.',
      ctaLabel: 'Browse packages',
    },
    resolve_decisions: {
      title: 'Resolve role decisions',
      description: 'Clear manual classification holds before downstream submission.',
      ctaLabel: 'Open role decisions',
    },
  },
  sponsor: {
    invite_contacts: {
      title: 'Invite & classify contacts',
      description:
        'Add cooperatives, exporters, importers, and producers — tag each contact by supply chain role and country.',
      ctaLabel: 'Invite contact',
    },
    register_orgs: {
      title: 'Register governed organisations',
      description: 'Map organisations across countries and commodities under your sponsor programme.',
      ctaLabel: 'Add organisation',
    },
    launch_programme: {
      title: 'Launch a transparency programme',
      description:
        'Run sponsor-funded programmes to collect EUDR evidence and sustainable market readiness data.',
      ctaLabel: 'Launch programme',
    },
    review_compliance: {
      title: 'Review compliance by market',
      description:
        'Baseline transparency, deforestation-risk signals, and escalation hotspots before interventions.',
      ctaLabel: 'Open compliance health',
    },
  },
};

const VIRGIN_SHELL_COPY = {
  step_progress: { key: 'workflow.virgin.shell.step_progress', fallback: 'Step {{current}} of {{total}}' },
  completed_count: { key: 'workflow.virgin.shell.completed_count', fallback: '{{count}} completed' },
  unlocks_after: { key: 'workflow.virgin.shell.unlocks_after', fallback: 'Unlocks after step {{step}}' },
  completed: { key: 'workflow.virgin.shell.completed', fallback: 'Completed' },
  focus_hint: {
    key: 'workflow.virgin.shell.focus_hint',
    fallback: 'Focus on one step at a time. Metrics and pipeline views appear once you create your first records.',
  },
} as const;

export type VirginStepView = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

function virginStepKey(role: TenantRole, stepId: string, field: StepField): string {
  return `workflow.virgin.${role}.${stepId}.${field}`;
}

function virginHeadingKey(role: TenantRole, field: 'title' | 'description'): string {
  return `workflow.virgin.heading.${role}.${field}`;
}

export function getVirginStateHeadingCopy(
  role: TenantRole,
  field: 'title' | 'description',
  t?: TranslateFn,
): string {
  const fallback = VIRGIN_HEADING_FALLBACKS[role][field];
  return wf(virginHeadingKey(role, field), fallback, t);
}

export function getVirginStateStepCopy(
  role: TenantRole,
  stepId: string,
  field: StepField,
  t?: TranslateFn,
): string {
  const fallback = VIRGIN_STEP_FALLBACKS[role][stepId]?.[field] ?? stepId;
  return wf(virginStepKey(role, stepId, field), fallback, t);
}

export function getVirginStateShellCopy(
  key: keyof typeof VIRGIN_SHELL_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = VIRGIN_SHELL_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getVirginStepsForRole(role: TenantRole, t?: TranslateFn): VirginStepView[] {
  return VIRGIN_STEP_IDS[role].map((stepId) => ({
    id: stepId,
    title: getVirginStateStepCopy(role, stepId, 'title', t),
    description: getVirginStateStepCopy(role, stepId, 'description', t),
    ctaLabel: getVirginStateStepCopy(role, stepId, 'ctaLabel', t),
    href: VIRGIN_STEP_HREFS[stepId],
  }));
}

export function getVirginStateCopyManifest(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const [role, heading] of Object.entries(VIRGIN_HEADING_FALLBACKS)) {
    manifest[virginHeadingKey(role as TenantRole, 'title')] = heading.title;
    manifest[virginHeadingKey(role as TenantRole, 'description')] = heading.description;
  }
  for (const [role, steps] of Object.entries(VIRGIN_STEP_FALLBACKS)) {
    for (const [stepId, fields] of Object.entries(steps)) {
      for (const [field, fallback] of Object.entries(fields)) {
        manifest[virginStepKey(role as TenantRole, stepId, field as StepField)] = fallback;
      }
    }
  }
  for (const entry of Object.values(VIRGIN_SHELL_COPY)) {
    manifest[entry.key] = entry.fallback;
  }
  return manifest;
}
