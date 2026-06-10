import type { MarketingRouteId } from '@/lib/marketing-publication';

export type DraftPageSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type DraftHubLink = {
  /** Omitted for live (ungated) persona pages linked from definition hubs. */
  routeId?: MarketingRouteId;
  href: string;
  title: string;
  description: string;
};

export type DraftPageContent = {
  routeId: MarketingRouteId;
  title: string;
  description: string;
  eyebrow?: string;
  sections: DraftPageSection[];
  relatedLinks?: DraftHubLink[];
};

export type DraftHubContent = {
  routeId: MarketingRouteId;
  title: string;
  description: string;
  eyebrow?: string;
  links: DraftHubLink[];
};

export const platformHub: DraftHubContent = {
  routeId: 'platform',
  eyebrow: 'Platform',
  title: 'The agrifood operating system',
  description:
    'Two core products power every module: offline Field App capture and a collaboration Dashboard on one shared data model.',
  links: [
    {
      routeId: 'platform-field-app',
      href: '/platform/field-app',
      title: 'Field App',
      description: 'Zero-friction, offline-first georeferencing and first-mile capture.',
    },
    {
      routeId: 'platform-dashboard',
      href: '/platform/dashboard',
      title: 'Dashboard',
      description: 'Visualize, validate, and share supply chain data across roles.',
    },
    {
      routeId: 'platform-offline-mapping',
      href: '/platform/offline-mapping',
      title: 'Offline mapping (legacy URL)',
      description: 'Detailed field-capture story — merges into Field App at launch.',
    },
    {
      routeId: 'platform-ai-verification',
      href: '/platform/ai-verification',
      title: 'AI verification (legacy URL)',
      description: 'Satellite models and photo vault — referenced from Field App + EUDR solution.',
    },
  ],
};

export const solutionsHub: DraftHubContent = {
  routeId: 'solutions',
  eyebrow: 'Solutions',
  title: 'Modular solutions marketplace',
  description:
    'Toggle only what you need. Start with EUDR compliance; add sustainability, ethical sourcing, and trade modules as you grow.',
  links: [
    {
      routeId: 'solutions-eudr-compliance',
      href: '/solutions/eudr-compliance',
      title: 'EUDR compliance',
      description: 'Automated DDS prep, satellite calibration, TRACES filing — start here.',
    },
    {
      routeId: 'solutions-esg-carbon-reporting',
      href: '/solutions/esg-carbon-reporting',
      title: 'ESG & carbon reporting',
      description: 'Scope 3 visibility and Cool Farm Tool integration (roadmap where noted).',
    },
    {
      routeId: 'solutions-regenerative-agriculture',
      href: '/solutions/regenerative-agriculture',
      title: 'Regenerative agriculture',
      description: 'FSA digital wizard, continuous improvement, auditor portal.',
    },
    {
      routeId: 'solutions-child-labor-monitoring',
      href: '/solutions/child-labor-monitoring',
      title: 'Child labor & ethical sourcing',
      description: 'CLMRS surveys and remediation tracking in the Field App.',
    },
    {
      routeId: 'solutions-open-chain-model',
      href: '/solutions/open-chain-model',
      title: 'Open Chain model',
      description: 'Shared-risk sourcing with LIRP + 20% premium and 5-year MoUs.',
    },
    {
      routeId: 'solutions-direct-trade-marketplace',
      href: '/solutions/direct-trade-marketplace',
      title: 'Direct trade marketplace',
      description: 'Verified listings, milestone escrow, farmer data sovereignty.',
    },
  ],
};

export const whoWeServeHub: DraftHubContent = {
  routeId: 'who-we-serve',
  eyebrow: 'Who we serve',
  title: 'Every actor in the chain',
  description:
    'Self-serve onboarding for producers, cooperatives, exporters, brands, sponsors, and governments — bidirectional workflows from any entry point.',
  links: [
    {
      href: '/farmers',
      title: 'Producers & cooperatives',
      description: 'Field App + cooperative roll-up — free for farmers.',
    },
    {
      routeId: 'cooperatives',
      href: '/cooperatives',
      title: 'Cooperatives (draft)',
      description: 'Member coordination and evidence roll-up.',
    },
    {
      href: '/exporters',
      title: 'Exporters & processors',
      description: 'Dashboard-led batch preparation and DDS packaging.',
    },
    {
      href: '/importers',
      title: 'Brands & roasters',
      description: 'Downstream visibility, TRACES submission, supplier risk.',
    },
    {
      routeId: 'sponsors',
      href: '/sponsors',
      title: 'Network sponsors',
      description: 'Programmes sponsoring exporter and importer networks.',
    },
    {
      href: '/countries',
      title: 'Governments & countries',
      description: 'National DPI and regional auditor portals.',
    },
  ],
};

export const resourcesHub: DraftHubContent = {
  routeId: 'resources',
  eyebrow: 'Resources',
  title: 'Trust, standards, and knowledge',
  description: 'Regulatory insights, data sovereignty, verification standards, and developer APIs.',
  links: [
    {
      routeId: 'insights',
      href: '/insights',
      title: 'Insights & regulatory tracker',
      description: 'Articles on EUDR, field capture, and supply chain resilience.',
    },
    {
      routeId: 'resources-data-sovereignty-security',
      href: '/resources/data-sovereignty-security',
      title: 'Data sovereignty & security',
      description: 'Farmer wallets, tenant isolation, retention, and encryption.',
    },
    {
      routeId: 'resources-verification-standards',
      href: '/resources/verification-standards',
      title: 'Verification standards',
      description: 'Geometry rules, identity preservation, and audit lineage.',
    },
    {
      routeId: 'resources-api-docs',
      href: '/resources/api-docs',
      title: 'API documentation',
      description: 'Integrations, TRACES middleware, and ESG connectors.',
    },
  ],
};

export const impactHub: DraftHubContent = {
  routeId: 'impact',
  eyebrow: 'Impact',
  title: 'People, land, and planet',
  description:
    'Compliance opens markets. Regenerative practice keeps them open. Tracebud connects both with proof the whole chain can trust.',
  links: [
    {
      routeId: 'impact-farmer-livelihood',
      href: '/impact/farmer-livelihood',
      title: 'Farmer livelihood',
      description: 'Ownership, market access, and income resilience for smallholders.',
    },
    {
      routeId: 'impact-regenerative-farming',
      href: '/impact/regenerative-farming',
      title: 'Regenerative farming',
      description: 'Farm resilience through practices verified at plot level.',
    },
    {
      routeId: 'impact-climate-biodiversity',
      href: '/impact/climate-biodiversity',
      title: 'Climate & biodiversity',
      description: 'Deforestation-free supply chains and pathways to ESRS-aligned evidence.',
    },
    {
      routeId: 'why-tracebud',
      href: '/why-tracebud',
      title: 'Why Tracebud',
      description: 'Infrastructure principles — not another closed compliance silo.',
    },
  ],
};

export const complianceHub: DraftHubContent = {
  routeId: 'compliance',
  eyebrow: 'Compliance',
  title: 'Compliance hub',
  description:
    'EUDR-aligned workflows from plot capture through due diligence, batch readiness, and auditable retention.',
  links: [
    {
      routeId: 'compliance-eudr',
      href: '/compliance/eudr',
      title: 'EUDR hub',
      description: 'Deadlines, commodities, simplified declarations, and risk context.',
    },
    {
      routeId: 'compliance-due-diligence',
      href: '/compliance/due-diligence',
      title: 'Due diligence workflow',
      description: 'Plot → verify → batch → DDS → TRACES submission path.',
    },
    {
      routeId: 'compliance-guides',
      href: '/compliance/guides',
      title: 'Guides & checklists',
      description: 'Downloadable playbooks for exporters, importers, and cooperatives.',
    },
    {
      routeId: 'compliance-security',
      href: '/compliance/security',
      title: 'Security & audit',
      description: 'Tenant isolation, retention, encryption, and audit lineage.',
    },
  ],
};

export const draftPages: Record<string, DraftPageContent> = {
  'platform-offline-mapping': {
    routeId: 'platform-offline-mapping',
    eyebrow: 'Platform',
    title: 'Offline-first mapping',
    description: 'Capture plot boundaries where signal is unreliable and GNSS accuracy drops under canopy.',
    sections: [
      {
        heading: 'Built for field conditions',
        body: 'Tropical canopy causes multipath interference. Smartphone GPS often drifts to 5–15 meters. Tracebud does not hard-lock on HDOP thresholds that reject real captures.',
      },
      {
        heading: 'Waypoint averaging',
        body: 'At each vertex the app records a coordinate stream for 60–120 seconds and computes a mean position to filter error.',
        bullets: [
          'Dual-frequency GNSS when hardware supports it',
          'Manual perimeter trace on cached satellite imagery when GNSS fails',
          'Sync when connectivity returns with conflict-safe ordering',
        ],
      },
      {
        heading: 'Geometry rules',
        body: 'Plots under 4 hectares may use a centroid point or polygon. Plots of 4 hectares or more require a complete perimeter polygon. All coordinates use six decimal places minimum.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-offline-mapping'),
  },
  'platform-ai-verification': {
    routeId: 'platform-ai-verification',
    eyebrow: 'Platform',
    title: 'AI verification',
    description: 'Geospatial foundation models and ground-truth evidence reduce false positives on shade-grown and agroforestry systems.',
    sections: [
      {
        heading: 'Geospatial foundation models',
        body: 'Batch inference on cost-efficient GPU infrastructure evaluates spatial and temporal signals together — distinguishing deforestation from seasonal pruning where rigid algorithms fail.',
      },
      {
        heading: 'Photo vault',
        body: 'Timestamped, geo-tagged field photos provide localized evidence to override automated satellite false positives during manual review.',
      },
      {
        heading: 'Degradation checks',
        body: 'Structural forest cover changes — including conversion to plantation — surface as reviewable flags rather than silent passes.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-ai-verification'),
  },
  'platform-network': {
    routeId: 'platform-network',
    eyebrow: 'Platform',
    title: 'Network & data sovereignty',
    description: 'An open network where any actor can start a workflow — with farmers in control of their compliance data.',
    sections: [
      {
        heading: 'Request-grant architecture',
        body: 'Brands, importers, exporters, cooperatives, and farmers enter independently. Data moves through explicit grants instead of forced hierarchical uploads.',
      },
      {
        heading: 'Farmer data wallet',
        body: 'Farmers own their GeoID and compliance passport. They grant or revoke access to cooperatives and buyers without vendor lock-in.',
      },
      {
        heading: 'Multi-tenant isolation',
        body: 'Every organization is a tenant. Data is scoped by active organization context with strict isolation between tenants unless permission is granted.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-network'),
  },
  'platform-integrations': {
    routeId: 'platform-integrations',
    eyebrow: 'Platform',
    title: 'Integrations',
    description: 'Inbound registry sync and outbound regulatory filing through purpose-built middleware.',
    sections: [
      {
        heading: 'TRACES NT',
        body: 'EU filing uses legacy SOAP/XML with WS-Security — not simple REST. Tracebud middleware translates internal JSON into compliant payloads with digest computation and polygon chunking when limits are exceeded.',
      },
      {
        heading: 'National registries',
        body: 'Inbound endpoints can sync baseline boundaries from institutes such as ICF and IHCAFE to reduce duplicate capture work.',
      },
      {
        heading: 'ESG platforms',
        body: 'REST APIs push verified supply chain data toward corporate ESG workflows (EcoVadis, Sustainalytics) without manual re-entry — roadmap where not yet live in pilot.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-integrations'),
  },
  'compliance-eudr': {
    routeId: 'compliance-eudr',
    eyebrow: 'Compliance',
    title: 'EUDR hub',
    description: 'Regulatory context for coffee, cocoa, rubber, soy, cattle, and timber supply chains entering EU markets.',
    sections: [
      {
        heading: 'Key deadlines',
        body: 'Large and medium enterprises: 30 December 2026. Micro and small enterprises: 30 June 2027.',
      },
      {
        heading: 'Simplified declarations',
        body: 'Micro and small primary operators in low-risk countries who produce commodities themselves may qualify for a one-time simplified declaration instead of per-shipment statements.',
      },
      {
        heading: 'Identity preservation',
        body: 'Mass-balance chains that obscure origin coordinates are not compliant. Tracebud tracks identity-preserved batches end to end.',
      },
    ],
    relatedLinks: complianceHub.links.filter((l) => l.routeId !== 'compliance-eudr'),
  },
  'compliance-due-diligence': {
    routeId: 'compliance-due-diligence',
    eyebrow: 'Compliance',
    title: 'Due diligence workflow',
    description: 'From first plot capture to audit-ready shipment records.',
    sections: [
      {
        heading: 'Capture',
        body: 'Farmers and field teams record plots, evidence, and consent through the mobile app — once, reusable across buyers.',
      },
      {
        heading: 'Verify',
        body: 'Automated deforestation and degradation checks plus photo vault review. Amber flags route to manual review instead of silent approval.',
      },
      {
        heading: 'Package & submit',
        body: 'Exporters aggregate verified farmer vouchers into batches, run yield-cap and pre-flight checks, generate DDS artifacts, and file via TRACES middleware.',
        bullets: [
          'Yield-cap validation against biological carrying capacity',
          'Zero-risk pre-flight check across full batch pool before TRACES unlock',
          'Five-year secure retention with lifecycle tiering',
        ],
      },
    ],
    relatedLinks: complianceHub.links.filter((l) => l.routeId !== 'compliance-due-diligence'),
  },
  'compliance-guides': {
    routeId: 'compliance-guides',
    eyebrow: 'Compliance',
    title: 'Guides & checklists',
    description: 'Practical playbooks — PDF downloads can be gated at launch.',
    sections: [
      {
        heading: 'Available guides',
        body: 'Start with Insights playbooks; downloadable PDFs land in Stage C.',
        bullets: [
          'Exporter EUDR readiness checklist (see Insights)',
          'Importer supplier visibility workbook (planned)',
          'Cooperative member roll-up playbook (planned)',
          'Farmer first-plot capture guide (planned)',
        ],
      },
      {
        heading: 'Related reading',
        body: 'Regulatory explainers and technology deep-dives live in Insights until PDF assets are ready.',
      },
    ],
    relatedLinks: complianceHub.links.filter((l) => l.routeId !== 'compliance-guides'),
  },
  'compliance-security': {
    routeId: 'compliance-security',
    eyebrow: 'Compliance',
    title: 'Security & audit',
    description: 'Tenant-scoped access, symmetric encryption for PII, and immutable audit references.',
    sections: [
      {
        heading: 'Tenant isolation',
        body: 'One tenant cannot access another tenant\'s data without explicit grant. RBAC is evaluated in active organization context.',
      },
      {
        heading: 'Retention',
        body: 'Due diligence data stored securely for at least five years with automated lifecycle tiering to cold archive for cost efficiency.',
      },
      {
        heading: 'Privacy vs transparency',
        body: 'Farmer PII is symmetrically encrypted — not irreversibly hashed — because authorities and importers of record require verifiable chain visibility under RBAC.',
      },
    ],
    relatedLinks: complianceHub.links.filter((l) => l.routeId !== 'compliance-security'),
  },
  sponsors: {
    routeId: 'sponsors',
    eyebrow: 'Solutions',
    title: 'Network sponsors',
    description:
      'For export boards, certification bodies, brands, and NGOs sponsoring exporter and importer networks with centralized compliance oversight.',
    sections: [
      {
        heading: 'Tier 4 — Network Sponsors',
        body: 'Sponsor unlimited exporter and importer organizations across your network with a centralised compliance dashboard. Pricing is custom — typically from €19/month per sponsored organization.',
      },
      {
        heading: 'Who this is for',
        body: 'National export boards, large traders, certification bodies, and development programmes funding EUDR readiness across many actors.',
        bullets: [
          'Centralised visibility across sponsored orgs',
          'SLA-backed support and tailored onboarding',
          'ESG connector access for downstream reporting',
        ],
      },
      {
        heading: 'Related paths',
        body: 'Governments building national infrastructure may also start from the countries page or pilot programme.',
      },
    ],
    relatedLinks: [
      { routeId: 'compliance-eudr', href: '/compliance/eudr', title: 'EUDR hub', description: '' },
      { routeId: 'platform-network', href: '/platform/network', title: 'Network & sovereignty', description: '' },
    ],
  },
  cooperatives: {
    routeId: 'cooperatives',
    eyebrow: 'Solutions',
    title: 'Cooperatives',
    description: 'Roll up member plot data, coordinate outreach, and present audit-ready evidence to exporters and buyers.',
    sections: [
      {
        heading: 'Member coordination',
        body: 'Upload or invite members, send bulk mapping requests, and track completion without manual spreadsheet chasing.',
      },
      {
        heading: 'Evidence roll-up',
        body: 'Aggregate verified farmer vouchers while preserving identity and lineage for each contributing plot.',
      },
      {
        heading: 'Network entry point',
        body: 'Cooperatives can initiate requests downstream or respond to importer and brand outreach through the same shared inbox model.',
      },
    ],
    relatedLinks: [
      { routeId: 'platform-network', href: '/platform/network', title: 'Network & sovereignty', description: '' },
      { routeId: 'compliance-due-diligence', href: '/compliance/due-diligence', title: 'Due diligence workflow', description: '' },
    ],
  },
  'impact-farmer-livelihood': {
    routeId: 'impact-farmer-livelihood',
    eyebrow: 'Impact',
    title: 'Farmer livelihood',
    description:
      'Smallholders should benefit from compliance — not bear its cost alone. Tracebud puts farmers in control of their data and their market choices.',
    sections: [
      {
        heading: 'Capture once, sell broadly',
        body: 'Farmers map plots and build a compliance passport once, then grant access to cooperatives and buyers without repeating field work.',
      },
      {
        heading: 'Self-sovereign data wallet',
        body: 'GeoIDs and evidence stay farmer-owned. Grants can be revoked. No forced lock-in to a single exporter ecosystem.',
      },
      {
        heading: 'Free entry for producers',
        body: 'Tier 1 is free forever — removing the financial barrier that often excludes smallholders from export markets.',
      },
      {
        heading: 'Tracebud connection',
        body: 'Mobile offline capture → reusable records → explicit grants → better market access.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-farmer-livelihood'),
  },
  'impact-regenerative-farming': {
    routeId: 'impact-regenerative-farming',
    eyebrow: 'Impact',
    title: 'Regenerative farming',
    description:
      'Shade-grown, agroforestry, and soil-health practices need evidence — not just intentions. Plot-level records make farm resilience auditable.',
    sections: [
      {
        heading: 'Practice + place',
        body: 'Regenerative outcomes are tied to specific plots. Identity-preserved batches keep practice evidence linked to origin coordinates.',
      },
      {
        heading: 'Ground truth over false positives',
        body: 'Timestamped field photos and waypoint-averaged boundaries help distinguish seasonal pruning from deforestation — protecting shade-grown systems.',
      },
      {
        heading: 'Cooperative roll-up',
        body: 'Cooperatives aggregate member practice and plot health without laundering origins through mass-balance pools.',
      },
      {
        heading: 'Tracebud connection',
        body: 'Photo vault + AI verification + long-lived plot records → defensible regenerative narratives for buyers.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-regenerative-farming'),
  },
  'impact-climate-biodiversity': {
    routeId: 'impact-climate-biodiversity',
    eyebrow: 'Impact',
    title: 'Climate & biodiversity',
    description:
      'EUDR is the floor. Downstream buyers increasingly need climate and nature evidence aligned with ESRS — built on the same plot data.',
    sections: [
      {
        heading: 'Deforestation-free as baseline',
        body: 'Geospatial foundation models and degradation checks flag structural forest cover change — with manual review for buffer zones and agroforestry.',
      },
      {
        heading: 'Pathway to ESRS-aligned metrics',
        body: 'Data structures map toward farm-level environmental indicators (E1 climate, E3 water, E4 biodiversity) — pilot and roadmap where not yet live.',
        bullets: [
          'Scope 3 visibility starts at verified origin',
          'Land-use change tracked over multi-year windows',
          'Protected-area overlap routes to review, not silent pass',
        ],
      },
      {
        heading: 'Honest roadmap labelling',
        body: 'We do not claim full carbon accounting or certification today. We build the traceability base that makes those claims possible later.',
      },
      {
        heading: 'Tracebud connection',
        body: 'Plot capture → verification → ESG connector APIs (roadmap) → buyer reporting without manual re-entry.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-climate-biodiversity'),
  },
  'why-tracebud': {
    routeId: 'why-tracebud',
    eyebrow: 'Impact',
    title: 'Why Tracebud',
    description: 'Infrastructure principles — not another closed compliance silo.',
    sections: [
      {
        heading: 'Capture once',
        body: 'One map feeds every market and buyer relationship without duplicate field work.',
      },
      {
        heading: 'Works offline',
        body: 'Field-first design for low connectivity and imperfect GNSS — not office-only workflows.',
      },
      {
        heading: 'Farmer sovereignty',
        body: 'Farmers own GeoIDs and grant access explicitly. No forced platform lock-in.',
      },
      {
        heading: 'Identity preservation',
        body: 'Batches stay traceable to origin coordinates — no mass-balance laundering.',
      },
      {
        heading: 'Whole-chain network',
        body: 'Brands, importers, exporters, cooperatives, and farmers can all start workflows in multiple directions.',
      },
    ],
  },
  'platform-field-app': {
    routeId: 'platform-field-app',
    eyebrow: 'Platform',
    title: 'Field App',
    description:
      'Zero-friction, offline-first georeferencing and first-mile capture for producers and field teams.',
    sections: [
      {
        heading: 'Offline-first',
        body: 'Local cache with sync on connectivity. Field work continues without signal or perfect GNSS lock under canopy.',
      },
      {
        heading: 'Adaptive geometry',
        body: 'Point capture below 4 hectares; walk-boundary polygon at 4 hectares and above. Six decimal places minimum on all coordinates.',
        bullets: [
          'Waypoint averaging at vertices (60–120 seconds)',
          'Manual trace on cached imagery when GNSS fails',
          'HLC-ordered sync for conflict-safe offline edits',
        ],
      },
      {
        heading: 'Low-literacy onboarding',
        body: 'Phone number or magic link sign-in — designed for enumerator and farmer-first workflows, not office-only SaaS.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-field-app'),
  },
  'platform-dashboard': {
    routeId: 'platform-dashboard',
    eyebrow: 'Platform',
    title: 'Dashboard',
    description: 'Unified command center to visualize, validate, and share supply chain data across tenants and roles.',
    sections: [
      {
        heading: 'Multi-role access',
        body: 'Tenant-scoped RBAC for cooperatives, exporters, importers, brands, sponsors, and reviewers in one product surface.',
      },
      {
        heading: 'Automated plausibility checks',
        body: 'Duplicate detection, yield-cap validation, and missing-document flags before batches reach submission.',
      },
      {
        heading: 'One-click export',
        body: 'Compliance packages as PDF, CSV, and TRACES-compatible payloads through purpose-built middleware.',
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-dashboard'),
  },
  'solutions-eudr-compliance': {
    routeId: 'solutions-eudr-compliance',
    eyebrow: 'Solutions',
    title: 'EUDR compliance',
    description: 'Start here — automated due diligence preparation, satellite calibration, and TRACES NT filing.',
    sections: [
      {
        heading: 'Why start with EUDR',
        body: 'EU market access requires deforestation-free, legally produced commodities with auditable geolocation. Tracebud packages plot evidence into operator-ready DDS artifacts.',
      },
      {
        heading: 'Coffee-first differentiation',
        body: 'Multi-temporal satellite analysis and ground-truth photo vault reduce false positives on shade-grown and agroforestry systems.',
      },
      {
        heading: 'Identity preservation',
        body: 'Batches stay traceable to origin coordinates — no mass-balance laundering. Yield-cap validation flags over-claim before submission.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-eudr-compliance'),
  },
  'solutions-esg-carbon-reporting': {
    routeId: 'solutions-esg-carbon-reporting',
    eyebrow: 'Solutions',
    title: 'ESG & carbon reporting',
    description: 'Scope 3 visibility and farm-level environmental metrics — roadmap-labelled where not yet in MVP.',
    sections: [
      {
        heading: 'Scope 3 from verified origin',
        body: 'Downstream buyers need emissions visibility tied to real plots — not spreadsheet estimates.',
      },
      {
        heading: 'Cool Farm Tool conduit',
        body: 'FSA questionnaire data and GeoIDs route to CFT API for carbon scores (pilot / roadmap per MVP boundary).',
      },
      {
        heading: 'ESRS-aligned mapping',
        body: 'Data structures map toward E1–E5 indicators for future corporate reporting connectors.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-esg-carbon-reporting'),
  },
  'solutions-regenerative-agriculture': {
    routeId: 'solutions-regenerative-agriculture',
    eyebrow: 'Solutions',
    title: 'Regenerative agriculture',
    description: 'FSA digital wizard, continuous improvement plans, and auditor-ready practice evidence at plot level.',
    sections: [
      {
        heading: 'Practice + place',
        body: 'Regenerative outcomes link to specific plots in identity-preserved batches.',
      },
      {
        heading: 'FSA alignment',
        body: 'Digital questionnaires aligned with SAI Platform Farm Sustainability Assessment.',
      },
      {
        heading: 'Auditor portal',
        body: 'Review practice evidence without breaking farmer data sovereignty grants.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-regenerative-agriculture'),
  },
  'solutions-child-labor-monitoring': {
    routeId: 'solutions-child-labor-monitoring',
    eyebrow: 'Solutions',
    title: 'Child labor & ethical sourcing',
    description: 'CLMRS surveys and remediation tracking integrated in field workflows.',
    sections: [
      {
        heading: 'CLMRS in the Field App',
        body: 'Enumerators capture survey responses offline with the same sync model as plot capture.',
      },
      {
        heading: 'Remediation tracking',
        body: 'Follow-up actions and evidence attach to producer records for audit review.',
      },
      {
        heading: 'Roadmap',
        body: 'Full CLMRS module ships per MVP phasing — label pilot deployments honestly on sales calls.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-child-labor-monitoring'),
  },
  'solutions-open-chain-model': {
    routeId: 'solutions-open-chain-model',
    eyebrow: 'Solutions',
    title: 'Open Chain model',
    description: 'Shared-risk sourcing — traceability, LIRP + 20% premium, and multi-year mutual commitments.',
    sections: [
      {
        heading: '100% operational traceability',
        body: 'Segregated bean-to-brand or administrative matching with volume alignment — never obscuring origins.',
      },
      {
        heading: '20% livelihood premium',
        body: 'Pricing intent above Living Income Reference Price for farmer resilience.',
      },
      {
        heading: '5-year MoUs',
        body: 'Mutual commitments between roasters and cooperatives reduce boom-bust sourcing cycles.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-open-chain-model'),
  },
  'solutions-direct-trade-marketplace': {
    routeId: 'solutions-direct-trade-marketplace',
    eyebrow: 'Solutions',
    title: 'Direct trade marketplace',
    description: 'Verified listings, milestone escrow, and farmer-controlled data sharing.',
    sections: [
      {
        heading: 'Verified listings',
        body: 'Only plots and batches with completed compliance evidence appear in marketplace discovery.',
      },
      {
        heading: 'Milestone escrow',
        body: 'Payment release tied to delivery and verification milestones (roadmap).',
      },
      {
        heading: 'Farmer data sovereignty',
        body: 'Farmers grant access to buyers — they are not passive rows in an exporter database.',
      },
    ],
    relatedLinks: solutionsHub.links.filter((l) => l.routeId !== 'solutions-direct-trade-marketplace'),
  },
  'resources-data-sovereignty-security': {
    routeId: 'resources-data-sovereignty-security',
    eyebrow: 'Resources',
    title: 'Data sovereignty & security',
    description: 'Farmer wallets, request-grant sharing, tenant isolation, and five-year retention.',
    sections: [
      {
        heading: 'Farmer data wallet',
        body: 'Producers own GeoIDs and grant or revoke access without vendor lock-in.',
      },
      {
        heading: 'Tenant isolation',
        body: 'Strict multi-tenant boundaries with delegated administration per organization.',
      },
      {
        heading: 'Retention & encryption',
        body: 'Symmetric encryption for PII; lifecycle tiering for five-year EUDR retention.',
      },
    ],
    relatedLinks: resourcesHub.links.filter((l) => l.routeId !== 'resources-data-sovereignty-security'),
  },
  'resources-verification-standards': {
    routeId: 'resources-verification-standards',
    eyebrow: 'Resources',
    title: 'Verification standards',
    description: 'Geometry rules, identity preservation, and audit lineage expectations.',
    sections: [
      {
        heading: 'Geometry',
        body: 'GEOGRAPHY storage, ST_MakeValid with area variance guard, six-decimal coordinate minimum.',
      },
      {
        heading: 'Lineage',
        body: 'O(1) runtime traversal via materialized root plot arrays — no mass-balance laundering.',
      },
      {
        heading: 'Evidence chain',
        body: 'Immutable audit references with forward-chained supersession — no silent overwrites.',
      },
    ],
    relatedLinks: resourcesHub.links.filter((l) => l.routeId !== 'resources-verification-standards'),
  },
  'resources-api-docs': {
    routeId: 'resources-api-docs',
    eyebrow: 'Resources',
    title: 'API documentation',
    description: 'Developer integrations — TRACES middleware, registries, and ESG connectors.',
    sections: [
      {
        heading: 'TRACES NT adapter',
        body: 'SOAP/XML with WS-Security — not simple REST. Payload chunking when size or vertex limits apply.',
      },
      {
        heading: 'National registries',
        body: 'Inbound sync for baseline boundaries where institutes expose APIs.',
      },
      {
        heading: 'Developer docs',
        body: 'Full OpenAPI surface ships with product — this page is the marketing entry point.',
      },
    ],
    relatedLinks: resourcesHub.links.filter((l) => l.routeId !== 'resources-api-docs'),
  },
};

/** @deprecated Use marketingSiteMap from lib/marketing-site-map.ts */
export const allDraftRoutes: { routeId: MarketingRouteId; href: string; label: string }[] = [];
