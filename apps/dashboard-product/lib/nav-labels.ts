/** Maps RBAC nav item `name` values to locale keys in `locales/*.json`. */
export const NAV_ITEM_LABEL_KEYS: Record<string, string> = {
  Overview: 'nav.overview',
  Network: 'nav.network',
  Organisations: 'nav.organisations',
  Shipments: 'nav.shipments',
  'Compliance Health': 'nav.compliance_health',
  Evidence: 'nav.evidence',
  Campaigns: 'nav.campaigns',
  Programmes: 'nav.programmes',
  Requests: 'nav.requests',
  Reporting: 'nav.reporting',
  'Delegated Admin': 'nav.delegated_admin',
  'Billing & Coverage': 'nav.billing_coverage',
  Issues: 'nav.issues',
  'Tenure review': 'nav.tenure_review',
  'DDS Packages': 'nav.dds_packages',
  Harvests: 'nav.harvests',
  'Lots & Batches': 'nav.lots_batches',
  Plots: 'nav.plots',
  Farmers: 'nav.farmers',
  Producers: 'nav.producers',
  FPIC: 'nav.fpic',
  Contacts: 'nav.contacts',
  Members: 'nav.members',
  Outreach: 'nav.outreach',
  'Field Operations': 'nav.field_operations',
  Inbox: 'nav.inbox',
  Compliance: 'nav.compliance',
  Governance: 'nav.governance',
  'Role Decisions': 'nav.role_decisions',
  Reports: 'nav.reports',
  'Audit Log': 'nav.audit_log',
  Integrations: 'nav.integrations',
  Admin: 'nav.admin',
  Settings: 'nav.settings',
  Help: 'nav.help',
  Activity: 'nav.activity',
  'Content Tasks': 'nav.content_tasks',
  'Content Calendar': 'nav.content_calendar',
  'Content Review': 'nav.content_review',
  'CRM Templates': 'nav.crm_templates',
  'CRM Daily Actions': 'nav.crm_daily_actions',
  'CRM Prospects': 'nav.crm_prospects',
  'Demo Readiness': 'nav.demo_readiness',
  'Integrations Operations': 'nav.integrations_operations',
  'RBAC Matrix': 'nav.rbac_matrix',
  'User Management': 'nav.user_management',
};

export type AppBreadcrumb = { label: string; href?: string };

export function getDashboardBreadcrumb(t?: (key: string) => string): AppBreadcrumb {
  const key = 'nav.dashboard';
  if (!t) return { label: 'Dashboard', href: '/' };
  const translated = t(key);
  return { label: translated === key ? 'Dashboard' : translated, href: '/' };
}

export function buildAppBreadcrumbs(
  t: ((key: string) => string) | undefined,
  ...tail: Array<{ name: string; href?: string }>
): AppBreadcrumb[] {
  const translate = t ?? ((key: string) => key);
  return [
    getDashboardBreadcrumb(t),
    ...tail.map((segment) => ({
      label: translateNavItemName(segment.name, translate),
      ...(segment.href ? { href: segment.href } : {}),
    })),
  ];
}

export function translateNavItemName(name: string, t: (key: string) => string): string {
  const key = NAV_ITEM_LABEL_KEYS[name];
  if (!key) return name;
  const translated = t(key);
  return translated === key ? name : translated;
}

export function translatePageHeader(
  t: ((key: string) => string) | undefined,
  pageKey: string,
  fallbacks: { title: string; subtitle?: string },
): { title: string; subtitle?: string } {
  const translate = t ?? ((key: string) => key);
  const titleKey = `page.${pageKey}.title`;
  const translatedTitle = translate(titleKey);
  const title = translatedTitle === titleKey ? fallbacks.title : translatedTitle;

  if (!fallbacks.subtitle) {
    return { title };
  }

  const subtitleKey = `page.${pageKey}.subtitle`;
  const translatedSubtitle = translate(subtitleKey);
  const subtitle = translatedSubtitle === subtitleKey ? fallbacks.subtitle : translatedSubtitle;
  return { title, subtitle };
}
