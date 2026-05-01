import type { DashboardMetrics } from '@/types';
import { mockPackages } from './packages';
import { mockPlots } from './plots';
import { mockFarmers } from './farmers';
import { mockActivities } from './activities';

export const mockDashboardMetrics: DashboardMetrics = {
  total_packages: mockPackages.length,
  total_plots: mockPlots.length,
  compliant_plots: mockPlots.filter((p) => p.verified).length,
  total_farmers: mockFarmers.length,
  pending_compliance: mockPackages.filter(
    (p) => p.compliance_status === 'PENDING' || p.compliance_status === 'WARNINGS'
  ).length,
  traces_submitted: mockPackages.filter((p) => p.status === 'SUBMITTED' || p.status === 'ACCEPTED').length,
  compliance_rate: 78,
  packages_by_status: {
    DRAFT: mockPackages.filter((p) => p.status === 'DRAFT').length,
    READY: mockPackages.filter((p) => p.status === 'READY').length,
    SEALED: mockPackages.filter((p) => p.status === 'SEALED').length,
    SUBMITTED: mockPackages.filter((p) => p.status === 'SUBMITTED').length,
    ACCEPTED: mockPackages.filter((p) => p.status === 'ACCEPTED').length,
    REJECTED: mockPackages.filter((p) => p.status === 'REJECTED').length,
    ARCHIVED: mockPackages.filter((p) => p.status === 'ARCHIVED').length,
    ON_HOLD: mockPackages.filter((p) => p.status === 'ON_HOLD').length,
  },
  recent_activity: mockActivities,
};

export function getMockDashboardMetrics(): DashboardMetrics {
  return mockDashboardMetrics;
}
