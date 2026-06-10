import type { MarketingRouteId } from '@/lib/marketing-publication';

/** How complete the page is for the v0 styling pass. */
export type SiteMapPageStatus =
  | 'live-styled'
  | 'draft-needs-style'
  | 'preview-assembly'
  | 'legal';

export type SiteMapSectionId =
  | 'home'
  | 'solutions'
  | 'platform'
  | 'compliance'
  | 'impact'
  | 'insights'
  | 'convert'
  | 'legal'
  | 'meta'
  | 'definition-june-2026';

export type SiteMapSection = {
  id: SiteMapSectionId;
  label: string;
  description: string;
};

export type SiteMapEntry = {
  id: string;
  label: string;
  href: string;
  section: SiteMapSectionId;
  status: SiteMapPageStatus;
  /** Set when route is behind publication gate in production. */
  routeId?: MarketingRouteId;
  /** Canonical URL from TRACEBUD_DEFINITION_JUNE_2026.md when different from href. */
  definitionTarget?: string;
  v0Notes?: string;
};

export const siteMapSections: SiteMapSection[] = [
  {
    id: 'meta',
    label: 'Meta & assembly',
    description: 'Internal indexes and homepage preview for Stage B.',
  },
  {
    id: 'home',
    label: 'Home',
    description: 'Live homepage and v2 preview assembly.',
  },
  {
    id: 'solutions',
    label: 'Solutions',
    description: 'Persona and role-based entry pages.',
  },
  {
    id: 'platform',
    label: 'Platform',
    description: 'Product depth — mobile, dashboard, AI, network, integrations.',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'EUDR hub, workflows, guides, and security.',
  },
  {
    id: 'impact',
    label: 'Impact',
    description: 'Livelihood, regenerative farming, climate & biodiversity — the brand spine.',
  },
  {
    id: 'insights',
    label: 'Insights',
    description: 'Blog / thought leadership (markdown articles).',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Pricing, signup paths, pilot, and demo.',
  },
  {
    id: 'legal',
    label: 'Legal',
    description: 'Privacy and terms.',
  },
  {
    id: 'definition-june-2026',
    label: 'June 2026 definition (target IA)',
    description:
      'Canonical URLs from TRACEBUD_DEFINITION_JUNE_2026.md — scaffolded as stealth drafts. v0 may keep styling current URLs until Stage B renames.',
  },
];

/**
 * Canonical site map for v0 and Stage B assembly.
 * `live-styled` = existing pages already designed — v0 may polish only.
 * `draft-needs-style` = structure + copy in place; hand to v0 for layout/visual design.
 */
export const marketingSiteMap: SiteMapEntry[] = [
  // Meta
  {
    id: 'draft-index',
    label: 'Draft site index',
    href: '/draft',
    section: 'meta',
    status: 'preview-assembly',
    routeId: 'draft-index',
    v0Notes: 'Keep as internal QA map; hide from public nav at launch.',
  },

  // Home
  {
    id: 'home-live',
    label: 'Homepage (live)',
    href: '/',
    section: 'home',
    status: 'live-styled',
    v0Notes: 'Current production homepage. Stage B mounts home-v2 sections here.',
  },
  {
    id: 'home-preview',
    label: 'Homepage preview (v2 sections)',
    href: '/preview',
    section: 'home',
    status: 'preview-assembly',
    routeId: 'home-preview',
    v0Notes: 'Style hero + wire home-v2 blocks. Components in components/tracebud/home-v2/.',
  },

  // Solutions — live persona pages
  {
    id: 'farmers',
    label: 'Farmers & producers',
    href: '/farmers',
    section: 'solutions',
    status: 'live-styled',
    v0Notes: 'Existing styled page. Align nav cross-links at Stage B.',
  },
  {
    id: 'cooperatives',
    label: 'Cooperatives',
    href: '/cooperatives',
    section: 'solutions',
    status: 'draft-needs-style',
    routeId: 'cooperatives',
    v0Notes: 'Copy in marketing-draft-content.ts. Split from farmers page visually.',
  },
  {
    id: 'exporters',
    label: 'Exporters',
    href: '/exporters',
    section: 'solutions',
    status: 'live-styled',
    v0Notes: 'Existing styled page with lead form.',
  },
  {
    id: 'importers',
    label: 'Importers & brands',
    href: '/importers',
    section: 'solutions',
    status: 'live-styled',
    v0Notes: 'Existing styled page with lead form.',
  },
  {
    id: 'sponsors',
    label: 'Network sponsors',
    href: '/sponsors',
    section: 'solutions',
    status: 'draft-needs-style',
    routeId: 'sponsors',
    v0Notes: 'Tier 4 / export boards, cert bodies, NGOs. Mirror pricing tier 4 messaging.',
  },
  {
    id: 'countries',
    label: 'Governments & countries',
    href: '/countries',
    section: 'solutions',
    status: 'live-styled',
    v0Notes: 'Existing styled page — national DPI / country leads.',
  },
  {
    id: 'why-tracebud',
    label: 'Why Tracebud',
    href: '/why-tracebud',
    section: 'solutions',
    status: 'draft-needs-style',
    routeId: 'why-tracebud',
    v0Notes: 'Principles comparison page — five differentiators.',
  },

  // Platform
  {
    id: 'platform',
    label: 'Platform hub',
    href: '/platform',
    section: 'platform',
    status: 'draft-needs-style',
    routeId: 'platform',
  },
  {
    id: 'platform-offline',
    label: 'Offline mapping',
    href: '/platform/offline-mapping',
    section: 'platform',
    status: 'draft-needs-style',
    routeId: 'platform-offline-mapping',
  },
  {
    id: 'platform-ai',
    label: 'AI verification',
    href: '/platform/ai-verification',
    section: 'platform',
    status: 'draft-needs-style',
    routeId: 'platform-ai-verification',
  },
  {
    id: 'platform-network',
    label: 'Network & sovereignty',
    href: '/platform/network',
    section: 'platform',
    status: 'draft-needs-style',
    routeId: 'platform-network',
  },
  {
    id: 'platform-integrations',
    label: 'Integrations',
    href: '/platform/integrations',
    section: 'platform',
    status: 'draft-needs-style',
    routeId: 'platform-integrations',
  },

  // Compliance
  {
    id: 'compliance',
    label: 'Compliance hub',
    href: '/compliance',
    section: 'compliance',
    status: 'draft-needs-style',
    routeId: 'compliance',
  },
  {
    id: 'compliance-eudr',
    label: 'EUDR hub',
    href: '/compliance/eudr',
    section: 'compliance',
    status: 'draft-needs-style',
    routeId: 'compliance-eudr',
  },
  {
    id: 'compliance-dd',
    label: 'Due diligence workflow',
    href: '/compliance/due-diligence',
    section: 'compliance',
    status: 'draft-needs-style',
    routeId: 'compliance-due-diligence',
  },
  {
    id: 'compliance-guides',
    label: 'Guides & checklists',
    href: '/compliance/guides',
    section: 'compliance',
    status: 'draft-needs-style',
    routeId: 'compliance-guides',
  },
  {
    id: 'compliance-security',
    label: 'Security & audit',
    href: '/compliance/security',
    section: 'compliance',
    status: 'draft-needs-style',
    routeId: 'compliance-security',
  },

  // Impact
  {
    id: 'impact',
    label: 'Impact hub',
    href: '/impact',
    section: 'impact',
    status: 'draft-needs-style',
    routeId: 'impact',
    v0Notes: 'NEW — style after current v0 pass. Same DraftHubPage shell as platform. Three-pillar narrative.',
  },
  {
    id: 'impact-livelihood',
    label: 'Farmer livelihood',
    href: '/impact/farmer-livelihood',
    section: 'impact',
    status: 'draft-needs-style',
    routeId: 'impact-farmer-livelihood',
  },
  {
    id: 'impact-regenerative',
    label: 'Regenerative farming',
    href: '/impact/regenerative-farming',
    section: 'impact',
    status: 'draft-needs-style',
    routeId: 'impact-regenerative-farming',
  },
  {
    id: 'impact-climate',
    label: 'Climate & biodiversity',
    href: '/impact/climate-biodiversity',
    section: 'impact',
    status: 'draft-needs-style',
    routeId: 'impact-climate-biodiversity',
  },
  {
    id: 'impact-why',
    label: 'Why Tracebud',
    href: '/why-tracebud',
    section: 'impact',
    status: 'draft-needs-style',
    routeId: 'why-tracebud',
    v0Notes: 'Linked from Impact hub; may merge URL to /impact/why-tracebud at Stage B.',
  },

  // Insights
  {
    id: 'insights',
    label: 'Insights hub',
    href: '/insights',
    section: 'insights',
    status: 'draft-needs-style',
    routeId: 'insights',
    v0Notes: 'Hub + InsightsCard. Articles are markdown in content/insights/.',
  },

  // Convert
  {
    id: 'pricing',
    label: 'Pricing',
    href: '/pricing',
    section: 'convert',
    status: 'live-styled',
    v0Notes: 'Tier 1–4 including Network Sponsors. Existing full design.',
  },
  {
    id: 'get-started',
    label: 'Get started',
    href: '/get-started',
    section: 'convert',
    status: 'live-styled',
  },
  {
    id: 'pilot',
    label: 'Pilot program',
    href: '/pilot',
    section: 'convert',
    status: 'live-styled',
    v0Notes: 'Includes sponsor/country pilot roles in form.',
  },
  {
    id: 'demo',
    label: 'Demo',
    href: '/demo',
    section: 'convert',
    status: 'live-styled',
  },

  // Legal
  {
    id: 'privacy',
    label: 'Privacy',
    href: '/privacy',
    section: 'legal',
    status: 'legal',
  },
  {
    id: 'terms',
    label: 'Terms',
    href: '/terms',
    section: 'legal',
    status: 'legal',
  },

  // June 2026 definition — target IA (stealth drafts)
  {
    id: 'def-solutions',
    label: 'Solutions hub',
    href: '/solutions',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'solutions',
    definitionTarget: '/solutions',
    v0Notes: 'Modular marketplace hub. Style after v0 pass on impact/compliance unless prioritised.',
  },
  {
    id: 'def-solutions-eudr',
    label: 'EUDR compliance (solution)',
    href: '/solutions/eudr-compliance',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'solutions-eudr-compliance',
    definitionTarget: '/solutions/eudr-compliance',
    v0Notes: 'Merges compliance/eudr narrative at Stage B rename.',
  },
  {
    id: 'def-platform-field-app',
    label: 'Field App',
    href: '/platform/field-app',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'platform-field-app',
    definitionTarget: '/platform/field-app',
    v0Notes: 'Absorbs offline-mapping + field capture story.',
  },
  {
    id: 'def-platform-dashboard',
    label: 'Dashboard',
    href: '/platform/dashboard',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'platform-dashboard',
    definitionTarget: '/platform/dashboard',
  },
  {
    id: 'def-who-we-serve',
    label: 'Who we serve hub',
    href: '/who-we-serve',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'who-we-serve',
    definitionTarget: '/who-we-serve',
    v0Notes: 'Links to live persona pages until rename redirects.',
  },
  {
    id: 'def-resources',
    label: 'Resources hub',
    href: '/resources',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'resources',
    definitionTarget: '/resources',
  },
  {
    id: 'def-outcomes-supply',
    label: 'Resilient supply chains (target)',
    href: '/impact/supply-chains',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    definitionTarget: '/outcomes/resilient-supply-chains',
    v0Notes: 'v0 branch: style /impact/supply-chains; rename at Stage B.',
  },
  {
    id: 'def-outcomes-livelihood',
    label: 'Farmer livelihoods (target)',
    href: '/impact/farmer-livelihood',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'impact-farmer-livelihood',
    definitionTarget: '/outcomes/farmer-livelihoods',
    v0Notes: 'v0: also /impact/smallholders on styling branch.',
  },
  {
    id: 'def-outcomes-climate',
    label: 'Nature-positive climate (target)',
    href: '/impact/climate-biodiversity',
    section: 'definition-june-2026',
    status: 'draft-needs-style',
    routeId: 'impact-climate-biodiversity',
    definitionTarget: '/outcomes/nature-positive-climate',
    v0Notes: 'v0: also /impact/forests on styling branch.',
  },
];

export function getSiteMapBySection(sectionId: SiteMapSectionId): SiteMapEntry[] {
  return marketingSiteMap.filter((entry) => entry.section === sectionId);
}

export function getSiteMapSectionsWithEntries(): Array<SiteMapSection & { entries: SiteMapEntry[] }> {
  return siteMapSections.map((section) => ({
    ...section,
    entries: getSiteMapBySection(section.id),
  }));
}

export const siteMapStatusLabels: Record<SiteMapPageStatus, string> = {
  'live-styled': 'Live — styled',
  'draft-needs-style': 'Draft — needs v0 style',
  'preview-assembly': 'Preview assembly',
  legal: 'Legal',
};
