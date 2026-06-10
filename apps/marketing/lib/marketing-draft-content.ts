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
  title: 'Tracebud platform',
  description:
    'Mobile field capture and a multi-tenant dashboard share one data model for origin evidence, consent, lineage, and compliance records.',
  links: [
    {
      routeId: 'platform-offline-mapping',
      href: '/platform/offline-mapping',
      title: 'Offline mapping',
      description: 'Plot capture without connectivity or perfect GNSS lock.',
    },
    {
      routeId: 'platform-ai-verification',
      href: '/platform/ai-verification',
      title: 'AI verification',
      description: 'Satellite foundation models plus ground-truth photo vault.',
    },
    {
      routeId: 'platform-network',
      href: '/platform/network',
      title: 'Network & sovereignty',
      description: 'Request-grant workflows and farmer-owned data wallets.',
    },
    {
      routeId: 'platform-integrations',
      href: '/platform/integrations',
      title: 'Integrations',
      description: 'TRACES NT, national registries, and ESG connectors.',
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

export const impactHub: DraftHubContent = {
  routeId: 'impact',
  eyebrow: 'Impact',
  title: 'Real-world impact',
  description:
    'Tracebud links compliance infrastructure to outcomes that matter — fairer livelihoods for smallholders, healthier forests, and supply chains that hold up to scrutiny.',
  links: [
    {
      routeId: 'impact-smallholders',
      href: '/impact/smallholders',
      title: 'Smallholder livelihoods',
      description: 'How verified origin data unlocks premium markets for small-scale farmers.',
    },
    {
      routeId: 'impact-forests',
      href: '/impact/forests',
      title: 'Forest protection',
      description: 'Identity-preserved traceability as a direct tool for reducing deforestation.',
    },
    {
      routeId: 'impact-supply-chains',
      href: '/impact/supply-chains',
      title: 'Ethical supply chains',
      description: 'Structural transparency that goes beyond checkbox compliance.',
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
  'impact-smallholders': {
    routeId: 'impact-smallholders',
    eyebrow: 'Impact',
    title: 'Smallholder livelihoods',
    description:
      'Verified origin data is not just a compliance mechanism — it is the entry key to premium markets that pay fairer prices to small-scale farmers.',
    sections: [
      {
        heading: 'The premium market barrier',
        body: "Specialty buyers, Fairtrade, and Rainforest Alliance premiums require documented origin. Without it, smallholders' high-quality output is sold into undifferentiated bulk channels at commodity prices.",
      },
      {
        heading: 'One map, every market',
        body: "A single Tracebud GeoID links a farmer's plots, photos, and consent records to every buyer relationship they form — eliminating the capture-once burden that shuts smallholders out of multi-buyer access.",
        bullets: [
          'Field capture in < 20 minutes per farm with offline support',
          'Farmer-owned data wallet: grant or revoke per buyer',
          'Reusable across EUDR, ESG, and certification workflows',
        ],
      },
      {
        heading: 'Income resilience',
        body: 'Access to premium channels and multi-buyer price comparison helps smallholders reduce single-buyer dependency — a structural income resilience gain that compounds over seasons.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-smallholders'),
  },
  'impact-forests': {
    routeId: 'impact-forests',
    eyebrow: 'Impact',
    title: 'Forest protection',
    description:
      'Identity-preserved traceability creates accountability at the plot level — the most direct lever available to reduce deforestation driven by agricultural expansion.',
    sections: [
      {
        heading: 'Why identity preservation matters',
        body: 'Mass-balance chains allow deforestation-linked commodity to be laundered into compliant batches. Identity-preserved supply chains — where each batch traces to a verified plot polygon — eliminate that pathway.',
      },
      {
        heading: 'AI deforestation detection',
        body: 'Geospatial foundation models evaluate each registered plot against satellite time series to surface conversion events. Agroforestry and shade-grown systems are distinguished from cleared canopy to avoid false positives that penalise regenerative practices.',
        bullets: [
          'Temporal analysis distinguishes seasonal pruning from conversion',
          'Photo vault provides local evidence for manual flag review',
          'Degradation checks catch non-deforestation forest damage',
        ],
      },
      {
        heading: 'Systemic pressure',
        body: 'When buyers require identity-preserved, EUDR-compliant supply, deforestation-linked production loses its market outlet. Tracebud creates that market structure.',
      },
    ],
    relatedLinks: impactHub.links.filter((l) => l.routeId !== 'impact-forests'),
  },
  'impact-supply-chains': {
    routeId: 'impact-supply-chains',
    eyebrow: 'Impact',
    title: 'Ethical supply chains',
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
