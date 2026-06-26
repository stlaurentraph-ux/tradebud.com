import type { TenantRole } from '@/types';

export interface DashboardMaturityMetrics {
  total_packages?: number;
  total_plots?: number;
  total_farmers?: number;
  organisation_count?: number;
  contact_count?: number;
}

/** Canonical virgin thresholds — keep in sync with VirginStatePanel entry points. */
export function isVirginTenantForRole(
  role: TenantRole | null | undefined,
  metrics: DashboardMaturityMetrics,
): boolean {
  const packages = metrics.total_packages ?? 0;
  const plots = metrics.total_plots ?? 0;
  const farmers = metrics.total_farmers ?? 0;
  const organisations = metrics.organisation_count ?? 0;
  const contacts = metrics.contact_count ?? 0;

  switch (role) {
    case 'exporter':
      return packages === 0 && plots === 0 && farmers === 0;
    case 'importer':
    case 'country_reviewer':
      return packages === 0 && plots === 0;
    case 'cooperative':
      return farmers === 0 && plots === 0;
    case 'sponsor':
      return packages === 0 && plots === 0 && farmers === 0 && organisations === 0 && contacts === 0;
    default:
      return packages === 0 && plots === 0 && farmers === 0;
  }
}

export function isMatureTenantForRole(
  role: TenantRole | null | undefined,
  metrics: DashboardMaturityMetrics,
): boolean {
  return !isVirginTenantForRole(role, metrics);
}
