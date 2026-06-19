import type { MarketingRouteId } from '@/lib/marketing-publication';

export type DraftPageSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type DraftHubLink = {
  routeId: MarketingRouteId;
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
  title: 'Two components. Every solution runs on both.',
  description:
    'All modular solutions are built on the same shared infrastructure — offline field capture and a unified collaboration dashboard. Start with one; the other is already there.',
  links: [
    {
      routeId: 'platform-field-app',
      href: '/platform/field-app',
      title: 'Field App',
      description: 'Zero-friction offline georeferencing, consent capture, and first-mile evidence collection.',
    },
    {
      routeId: 'platform-dashboard',
      href: '/platform/dashboard',
      title: 'Dashboard',
      description: 'Unified command center to visualize, validate, automate checks, and share supply chain data.',
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

export const impactHub: DraftHubContent = {
  routeId: 'impact',
  eyebrow: 'Outcomes',
  title: 'Outcomes that hold up to scrutiny',
  description:
    'Compliance is the entry point — not the goal. Tracebud turns verified origin data into three durable outcomes: supply chains that survive audit, smallholders who capture more value, and a measurable path to nature-positive sourcing.',
  links: [
    {
      routeId: 'impact-supply-chains',
      href: '/impact/supply-chains',
      title: 'Resilient supply chains',
      description: 'Structural, audit-ready transparency that goes beyond self-reported claims.',
    },
    {
      routeId: 'impact-farmer-livelihood',
      href: '/impact/farmer-livelihood',
      title: 'Farmer livelihoods',
      description: 'Verified origin as the entry key to premium markets and fairer prices.',
    },
    {
      routeId: 'impact-climate-biodiversity',
      href: '/impact/climate-biodiversity',
      title: 'Nature-positive & climate',
      description: 'Deforestation-free as the floor, with a path to ESRS-aligned nature evidence.',
    },
  ],
};

export const draftPages: Record<string, DraftPageContent> = {
  'platform-field-app': {
    routeId: 'platform-field-app',
    eyebrow: 'Platform',
    title: 'Field App',
    description:
      'Zero-friction, offline-first capture of farm plots, consent records, and evidence — designed for real field conditions, not office assumptions.',
    sections: [
      {
        heading: 'Built for where farms actually are',
        body: 'Tropical canopy causes multipath interference and drops GPS accuracy to 5–15 meters. The Field App does not hard-lock on HDOP thresholds or require connectivity to function. All data is queued locally and syncs with conflict-safe ordering when a connection is available.',
        bullets: [
          'Offline-first local cache — works with zero signal',
          'Adaptive geolocation to six decimal places',
          'Waypoint averaging at each vertex (60–120 s coordinate stream)',
          'Dual-frequency GNSS support where hardware allows',
          'Manual perimeter trace on cached satellite imagery when GNSS fails',
        ],
      },
      {
        heading: 'Low-literacy onboarding',
        body: 'Farmer enrollment uses phone-number magic links and icon-led workflows. No app store install required. The same device a farmer already owns is enough to complete a full plot capture in under 20 minutes.',
        bullets: [
          'Phone or magic link — no account creation',
          'Icon-led field walkthrough',
          'Consent recorded with GPS-timestamped signature',
          'Photo vault attached to plot polygon at capture time',
        ],
      },
      {
        heading: 'Geometry standards',
        body: 'Plots under 4 hectares may use a centroid point or polygon. Plots of 4 hectares or more require a complete perimeter polygon. All coordinates are stored to six decimal places — meeting EUDR Article 9 precision requirements.',
      },
      {
        heading: 'Data sovereignty by default',
        body: "Each plot and consent record is owned by the farmer. A GeoID is issued at capture time and grants the farmer an explicit record they control. Buyers, exporters, and certification bodies access data through request-and-grant — not platform-controlled pipelines.",
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-field-app'),
  },
  'platform-dashboard': {
    routeId: 'platform-dashboard',
    eyebrow: 'Platform',
    title: 'Dashboard',
    description:
      'The unified command center for your supply chain — visualize your network, validate evidence, run automated checks, and export compliance-ready records.',
    sections: [
      {
        heading: 'One operating layer for the whole chain',
        body: 'The Dashboard is multi-tenant and multi-role. Brands, importers, exporters, cooperatives, and certification auditors each see a scoped view of the same underlying data — without platform-controlled visibility gates.',
        bullets: [
          'Multi-role tenant-scoped access (brand, exporter, cooperative, auditor)',
          'Request-and-grant visibility model — not forced pipelines',
          'Shared batch lineage from plot through to DDS',
          'Real-time supply network map',
        ],
      },
      {
        heading: 'Automated plausibility checks',
        body: 'AI verification runs as a background layer against every registered plot. Geospatial foundation models evaluate satellite time series to surface deforestation events, distinguishing cleared canopy from seasonal pruning and shade-grown agroforestry.',
        bullets: [
          'Satellite deforestation detection (post-2020 cutoff)',
          'Temporal analysis — seasonal vs. conversion events',
          'Agroforestry and shade-grown false-positive mitigation',
          'Photo vault evidence linked to flag review',
          'Degradation checks (non-deforestation forest damage)',
        ],
      },
      {
        heading: 'Compliance export',
        body: 'When a batch is ready, the Dashboard generates TRACES NT-compatible payloads and due diligence statement packages in one click. Records are retained for five years with immutable audit references.',
        bullets: [
          'One-click EUDR due diligence statement export',
          'TRACES NT-compatible payloads',
          'Five-year immutable retention with lifecycle tiering',
          'Competent authority inspection package generation',
        ],
      },
      {
        heading: 'Integrations',
        body: "TRACES NT, national producer registries, ESG frameworks (Cool Farm Tool, SACP), and certification body portals connect via open APIs. Tracebud does not require buyers or exporters to force their suppliers onto a proprietary platform — the network model is request-based.",
        bullets: [
          'TRACES NT & national registry connectors',
          'Cool Farm Tool integration for Scope 3 / ESG',
          'SACP cluster support',
          'Open API for ERP and certification system connections',
        ],
      },
    ],
    relatedLinks: platformHub.links.filter((l) => l.routeId !== 'platform-dashboard'),
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
    eyebrow: 'Outcomes',
    title: 'Farmer livelihoods',
    description:
      'Verified origin data is not just a compliance mechanism — it is the entry key to premium markets that pay fairer prices to small-scale farmers. Smallholders should benefit from compliance, not bear its cost alone.',
    sections: [
      {
        heading: 'The premium market barrier',
        body: "Specialty buyers, Fairtrade, and Rainforest Alliance premiums require documented origin. Without it, smallholders' high-quality output is sold into undifferentiated bulk channels at commodity prices.",
      },
      {
        heading: 'Capture once, sell to every market',
        body: "A single Tracebud GeoID links a farmer's plots, photos, and consent records to every buyer relationship they form — eliminating the capture-once burden that shuts smallholders out of multi-buyer access.",
        bullets: [
          'Field capture in under 20 minutes per farm, with offline support',
          'Farmer-owned data wallet: grant or revoke access per buyer',
          'Reusable across EUDR, ESG, and certification workflows',
          'No forced lock-in to a single exporter ecosystem',
        ],
      },
      {
        heading: 'Free entry for producers',
        body: 'Tier 1 is free forever — removing the financial barrier that often excludes smallholders from export markets entirely.',
      },
      {
        heading: 'Income resilience',
        body: 'Access to premium channels and multi-buyer price comparison helps smallholders reduce single-buyer dependency — a structural income resilience gain that compounds over seasons.',
      },
      {
        heading: 'Tracebud connection',
        body: 'Mobile offline capture → reusable farmer-owned records → explicit grants → better market access and fairer prices.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-farmer-livelihood'),
  },
  'impact-climate-biodiversity': {
    routeId: 'impact-climate-biodiversity',
    eyebrow: 'Outcomes',
    title: 'Nature-positive & climate',
    description:
      'EUDR is the floor. Downstream buyers increasingly need climate and nature evidence aligned with ESRS — built on the same plot data, and protecting the regenerative practices that should be rewarded rather than penalised.',
    sections: [
      {
        heading: 'Deforestation-free as the baseline',
        body: 'Geospatial foundation models evaluate each registered plot against satellite time series to surface conversion events. Identity-preserved batches — each tracing to a verified plot polygon — eliminate the mass-balance pathway that lets deforestation-linked commodity launder into compliant supply.',
        bullets: [
          'Temporal analysis distinguishes seasonal pruning from conversion',
          'Photo vault provides local evidence for manual flag review',
          'Degradation checks catch non-deforestation forest damage',
          'Protected-area overlap routes to review, not silent pass',
        ],
      },
      {
        heading: 'Regenerative practice, made auditable',
        body: 'Shade-grown, agroforestry, and soil-health practices need evidence, not just intentions. Timestamped field photos and waypoint-averaged boundaries keep practice evidence linked to origin coordinates — distinguishing regenerative systems from cleared canopy so they are protected rather than flagged as false positives.',
      },
      {
        heading: 'Pathway to ESRS-aligned metrics',
        body: 'Data structures map toward farm-level environmental indicators (E1 climate, E3 water, E4 biodiversity) — pilot and roadmap where not yet live.',
        bullets: [
          'Scope 3 visibility starts at verified origin',
          'Land-use change tracked over multi-year windows',
        ],
      },
      {
        heading: 'Honest roadmap labelling',
        body: 'We do not claim full carbon accounting or certification today. We build the traceability base that makes those claims possible later — and label clearly what is live versus roadmap.',
      },
      {
        heading: 'Tracebud connection',
        body: 'Plot capture → AI verification → ESG connector APIs (roadmap) → buyer reporting without manual re-entry.',
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
  'impact-supply-chains': {
    routeId: 'impact-supply-chains',
    eyebrow: 'Outcomes',
    title: 'Resilient supply chains',
    description:
      'Structural transparency — not self-reported claims — is the foundation of supply chains that hold up to independent scrutiny.',
    sections: [
      {
        heading: 'Beyond checkbox compliance',
        body: 'Most compliance frameworks accept self-declarations. Tracebud provides an independently auditable evidence trail: GPS-timestamped plot polygons, geo-tagged photos, signed consent records, and batch lineage logs.',
      },
      {
        heading: 'Whole-chain network',
        body: 'Brands, importers, exporters, cooperatives, and farmers can all initiate and respond to workflows in multiple directions. Visibility flows through explicit grants — not platform-controlled pipelines.',
        bullets: [
          'Brands request supply chain visibility without mandating farmer platforms',
          'Exporters aggregate cooperative and direct-sourced vouchers into one DDS',
          'Importers verify upstream readiness before shipment commitment',
        ],
      },
      {
        heading: 'Audit-ready retention',
        body: 'Due diligence records are retained for five years with immutable audit references and lifecycle tiering — ready for competent authority inspection without manual retrieval.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-supply-chains'),
  },
};

/** @deprecated Use marketingSiteMap from lib/marketing-site-map.ts */
export const allDraftRoutes: { routeId: MarketingRouteId; href: string; label: string }[] = [];
